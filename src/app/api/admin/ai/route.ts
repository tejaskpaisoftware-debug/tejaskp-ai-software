import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const { prompt, mode, history, sessionId } = await req.json();

        fs.appendFileSync('debug.log', `[${new Date().toISOString()}] POST /ai - Prompt: ${prompt?.substring(0, 20)}..., SessionId: ${sessionId}, Mode: ${mode}\n`);

        if (!prompt) return NextResponse.json({ message: 'Prompt required' }, { status: 400 });

        const lowerPrompt = prompt.toLowerCase();
        let aiResponseContent = "";
        let aiResponseType = "text"; // default
        let aiResponseData: any = null;

        // 1. Save User Message
        if (sessionId) {
            try {
                await prisma.aiMessage.create({
                    data: {
                        sessionId,
                        role: 'user',
                        content: prompt,
                        type: 'text'
                    }
                });
                fs.appendFileSync('debug.log', `[${new Date().toISOString()}] Saved USER message to session ${sessionId}\n`);
            } catch (err: any) {
                fs.appendFileSync('debug.log', `[${new Date().toISOString()}] ERROR saving USER message: ${err.message}\n`);
            }

            // Auto-update title if it's "New Chat"
            const session = await prisma.aiSession.findUnique({ where: { id: sessionId } });
            if (session && session.title === "New Chat") {
                const newTitle = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
                await prisma.aiSession.update({
                    where: { id: sessionId },
                    data: { title: newTitle }
                });
            }
        }

        // ---------------------------------------------------------
        // MODE: AI INTELLIGENCE (General Search)
        // ---------------------------------------------------------
        if (mode === 'AI') {
            try {
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                    return NextResponse.json({
                        message: "Error: GEMINI_API_KEY is missing in environment variables.",
                        type: 'text'
                    });
                }

                const genAI = new GoogleGenerativeAI(apiKey);

                // Prioritized list to solve Quota Issues.
                const CANDIDATE_MODELS = [
                    "gemini-2.0-flash-lite-preview-02-05", // Specific preview (often fresh quota)
                    "gemini-2.5-flash-lite",             // Newest Lite
                    "gemini-flash-lite-latest",          // Generic Lite
                    "gemini-2.0-flash-lite",             // Standard Lite
                    "gemini-pro-latest",                 // Pro fallback (valid alias)
                    "gemini-flash-latest",               // Flash fallback
                    "gemini-2.5-flash"                   // Newest Flash
                ];

                const systemInstruction = `
You are TEJASKP AI, the admin assistant.

### GLOBAL RULES
1. **Context**: Use conversation history to understand requests.
2. **General Chat**: Answer questions normally in plain text.

### ACTION COMMANDS (STRICT JSON OUTPUT)
If the user wants to perform an action, you MUST output ONLY valid JSON. Do not add markdown blocks like \`\`\`json.

#### 1. PDF GENERATION
Trigger: "create PDF", "download PDF", "invoice in PDF".
Response: {"action": "generate_pdf", "filename": "document.pdf", "content": "Full text content from context..."}

#### 2. IMAGE GENERATION (CRITICAL)
Trigger: "generate image", "create poster", "show photo".
Response: {"action": "generate_image", "prompt": "YOUR_EXPANDED_PROMPT_HERE"}

**IMAGE PROMPT RULES:**
1. **Correct**: Fix spelling (e.g. 'postre' -> 'poster').
2. **Expand**: Turn simple requests into pro descriptions. Add: "8k resolution, photorealistic, ultra-detailed, 4k, masterpiece".
3. **Text**: If user mentions specific text (e.g. "2026"), add: "Text '...' is written in bold, clear, elegant typography."
4. **No Chat**: Do not ask clarifying questions. Make a best guess and generate.

Example:
User: "Make a new year poster"
JSON: {"action": "generate_image", "prompt": "A festive New Year poster featuring fireworks and champagne. 8k resolution, photorealistic, ultra-detailed. Text 'Happy New Year' in bold gold typography."}
`;

                let lastError = null;
                let text = "";

                // LOOP: Try models one by one
                for (const modelName of CANDIDATE_MODELS) {
                    try {
                        console.log(`[AI] Attempting generation with model: ${modelName}`);
                        const model = genAI.getGenerativeModel({ model: modelName });

                        const chat = model.startChat({
                            history: history || [],
                            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
                        });

                        const result = await chat.sendMessage(prompt);
                        const response = await result.response;
                        text = response.text();

                        // Success!
                        lastError = null;
                        break;
                    } catch (error: any) {
                        console.warn(`[AI] Model ${modelName} failed: ${error.message}`);
                        lastError = error;
                        // Continue to next model if it's a quota or not-found error
                        if (error.message.includes('429') || error.message.includes('404') || error.message.includes('Quota') || error.message.includes('not found')) {
                            continue;
                        }
                    }
                }

                if (lastError) {
                    aiResponseContent = `System Busy: All AI models are currently at capacity. Please try again in 1 minute. (${lastError.message})`;
                } else {
                    aiResponseContent = text;
                    // Check if it's JSON (action) to determine type
                    if (text.includes('"action":')) {
                        try {
                            // Try to parse to see if it's data
                            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '');
                            JSON.parse(cleanJson);
                            aiResponseType = 'action'; // Mark as action so frontend handles it, but we store raw content
                        } catch (e) {
                            // ignore, keep text
                        }
                    }
                }

            } catch (aiError: any) {
                console.error("Gemini Critical Error:", aiError);
                aiResponseContent = `Internal AI Error: ${aiError.message}`;
            }
        }

        // ---------------------------------------------------------
        // MODE: DASHBOARD COMMANDS
        // ---------------------------------------------------------
        else {
            // COMMAND 1: FIND USER
            if (lowerPrompt.includes('find user') || lowerPrompt.includes('search user') || lowerPrompt.includes('who is')) {
                const query = lowerPrompt.replace('find user', '').replace('search user', '').replace('who is', '').trim();

                const users = await prisma.user.findMany({
                    where: {
                        OR: [
                            { name: { contains: query } },
                            { mobile: { contains: query } },
                            { email: { contains: query } }
                        ]
                    },
                    take: 5,
                    select: { id: true, name: true, mobile: true, role: true, status: true, course: true }
                });

                if (users.length === 0) {
                    aiResponseContent = `I couldn't find any user matching "${query}".`;
                } else {
                    aiResponseContent = `I found ${users.length} user(s) matching "${query}":`;
                    aiResponseType = 'data';
                    aiResponseData = { users };
                }
            }

            // COMMAND 2: ANALYTICS / REVENUE
            else if (lowerPrompt.includes('revenue') || lowerPrompt.includes('analytics') || lowerPrompt.includes('finance')) {
                const invoices = await prisma.invoice.findMany({ where: { status: 'PAID' } });
                const expenses = await prisma.purchase.findMany();

                const income = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
                const expense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

                aiResponseContent = "Here is your current financial overview:";
                aiResponseType = 'data';
                aiResponseData = {
                    revenue: {
                        income: income,
                        expense: expense,
                        profit: income - expense
                    }
                };
            }

            // COMMAND 3: COUNT USERS
            else if (lowerPrompt.includes('how many users') || lowerPrompt.includes('total users') || lowerPrompt.includes('active students')) {
                const total = await prisma.user.count();
                const students = await prisma.user.count({ where: { role: 'STUDENT' } });
                const active = await prisma.user.count({ where: { status: 'ACTIVE' } });

                aiResponseContent = `User Statistics:\n• Total Users: ${total}\n• Students: ${students}\n• Active Users: ${active}`;
            }

            // FALLBACK: MOCK AI
            else {
                const responses = [
                    "I'm currently in 'Command Mode' and didn't recognize that command.\n\n💡 **Tip:** Switch to **AI Search Mode** for general chat!",
                    "Command not found. try 'Find user <name>' or switch to 'AI Search Mode'."
                ];
                aiResponseContent = responses[Math.floor(Math.random() * responses.length)];
            }
        }

        // 2. Save Assistant Message
        if (sessionId) {
            await prisma.aiMessage.create({
                data: {
                    sessionId,
                    role: 'assistant', // or 'model'
                    content: aiResponseContent,
                    type: aiResponseType,
                    data: aiResponseData ? JSON.stringify(aiResponseData) : null
                }
            });

            // Touch session updated_at
            await prisma.aiSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() }
            });
        }

        return NextResponse.json({
            message: aiResponseContent,
            type: aiResponseType,
            data: aiResponseData
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ message: "Internal System Error" }, { status: 500 });
    }
}
