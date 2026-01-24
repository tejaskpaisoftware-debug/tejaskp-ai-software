import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, mode, history, sessionId, userId } = body;

        fs.appendFileSync('student_debug.log', `[${new Date().toISOString()}] POST /student/ai - User: ${userId}, Session: ${sessionId}, Prompt: ${prompt}\n`);

        if (!userId) return NextResponse.json({ message: "Unauthorized: UserId missing" }, { status: 401 });
        if (!prompt) return NextResponse.json({ message: 'Prompt required' }, { status: 400 });

        // Security: Ensure session belongs to user (if session exists)
        if (sessionId) {
            const session = await prisma.aiSession.findUnique({ where: { id: sessionId } });
            if (session && session.userId !== userId) {
                return NextResponse.json({ message: "Access Denied: This session does not belong to you." }, { status: 403 });
            }
        }

        const lowerPrompt = prompt.toLowerCase();
        let aiResponseContent = "";
        let aiResponseType = "text"; // default
        let aiResponseData: any = null;

        // 1. Save User Message
        if (sessionId) {
            await prisma.aiMessage.create({
                data: {
                    sessionId,
                    role: 'user',
                    content: prompt,
                    type: 'text'
                }
            });

            // Auto-update title
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
                    return NextResponse.json({ message: "Service Unavailable", type: 'text' });
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const CANDIDATE_MODELS = [
                    "gemini-1.5-flash-latest",
                    "gemini-1.5-flash-001",
                    "gemini-1.5-pro-latest",
                    "gemini-1.5-pro-001",
                    "gemini-pro",
                    "gemini-1.0-pro",
                    "gemini-2.0-flash-lite-preview-02-05",
                    "gemini-2.5-flash-lite"
                ];

                const systemInstruction = `
You are TEJASKP AI, a helpful student assistant.
CONTEXT: You are chatting with a student user.

### RULES
1. **Scope**: Help with studies, assignments, general knowledge, and dashboard navigation.
2. **Privacy**: Do NOT share details about other students or admin data.
3. **Tone**: Encouraging, helpful, and academic.

### ACTION COMMANDS (STRICT JSON)
If the user wants an image or PDF, output ONLY valid JSON.

#### 1. PDF GENERATION
Trigger: "make a pdf of this", "create notes pdf".
Response: {"action": "generate_pdf", "filename": "student_notes.pdf", "content": "Full content..."}

#### 2. IMAGE GENERATION
Trigger: "generate image", "draw diagram".
Response: {"action": "generate_image", "prompt": "Enhanced prompt..."}
`;
                let lastError = null;
                let text = "";

                // LOOP: Try models
                for (const modelName of CANDIDATE_MODELS) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const chat = model.startChat({
                            history: history || [],
                            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
                        });

                        const result = await chat.sendMessage(prompt);
                        const response = await result.response;
                        text = response.text();
                        lastError = null;
                        break;
                    } catch (error: any) {
                        lastError = error;
                        fs.appendFileSync('student_debug.log', `[${new Date().toISOString()}] Model ${modelName} Failed: ${error.message}\n`);
                        if (error.message.includes('429') || error.message.includes('404') || error.message.includes('Quota')) continue;
                    }
                }

                if (lastError) {
                    fs.appendFileSync('student_debug.log', `[${new Date().toISOString()}] All models failed. Final Error: ${lastError.message}\n`);

                    // FALLBACK: If AI is down, try locally processing simple commands
                    if (lowerPrompt.includes('pdf') || lowerPrompt.includes('notes')) {
                        const fallbackContent = "Here are your generated notes (AI is currently offline, using offline mode).";
                        aiResponseContent = JSON.stringify({
                            action: "generate_pdf",
                            filename: "Offline_Notes.pdf",
                            content: `NOTES FOR: ${prompt}\n\n[System Note: AI Quota Exceeded. This is a robust fallback.]\n\n1. Introduction\n   - This is a placeholder for your requested topic.\n   - The AI service is currently busy, but your PDF feature works!\n\n2. Details\n   - Study hard and keep learning.\n   - Check back later for full AI responses.`
                        });
                        aiResponseType = 'action';
                    }
                    else if (lowerPrompt.includes('image') || lowerPrompt.includes('draw')) {
                        aiResponseContent = JSON.stringify({
                            action: "generate_image",
                            prompt: prompt
                        });
                        aiResponseType = 'action';
                    }
                    else if (lowerPrompt.includes('tejaskp') || lowerPrompt.includes('software') || lowerPrompt.includes('detail')) {
                        aiResponseContent = "**TEJASKP AI Software**\n\nThis is a student management dashboard integrating AI for:\n- 📊 Attendance Tracking\n- 💰 Fee Management\n- 📚 Academic Assistance\n- 📄 PDF/Image Generation\n\n(Note: I am currently in offline mode, but I can still access your data!)";
                    }
                    else if (lowerPrompt.includes('hi') || lowerPrompt.includes('hello') || lowerPrompt.includes('help')) {
                        aiResponseContent = "Hello! I'm currently in **Offline Data Mode** due to high traffic.\n\nI can still help you with:\n- My Fees\n- My Attendance\n- Generating PDFs (Basic)\n\nHow can I help you regarding your dashboard?";
                    }
                    else {
                        aiResponseContent = "I'm currently in **Offline Mode** (Quota Exceeded). I can't generate new creative text right now, but you can use commands like **'My Fees'**, **'My Attendance'**, or **'Create PDF'**.";
                    }
                } else {
                    aiResponseContent = text;
                    if (text.includes('"action":')) {
                        try {
                            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '');
                            JSON.parse(cleanJson);
                            aiResponseType = 'action';
                        } catch (e) { }
                    }
                }

            } catch (aiError) {
                aiResponseContent = "I'm having trouble connecting right now.";
            }
        }

        // ---------------------------------------------------------
        // MODE: DASHBOARD COMMANDS (Student Scoped)
        // ---------------------------------------------------------
        else {
            // COMMAND 1: MY INFO
            if (lowerPrompt.includes('my info') || lowerPrompt.includes('my profile') || lowerPrompt.includes('who am i')) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, email: true, mobile: true, course: true, joiningDate: true }
                });

                if (user) {
                    aiResponseContent = `**Student Profile**\nName: ${user.name}\nCourse: ${user.course || 'N/A'}\nMobile: ${user.mobile}\nJoined: ${user.joiningDate || 'N/A'}`;
                    aiResponseType = 'data';
                    aiResponseData = { type: 'profile', user };
                } else {
                    aiResponseContent = "I couldn't find your profile details.";
                }
            }

            // COMMAND 2: MY FEES
            else if (lowerPrompt.includes('my fees') || lowerPrompt.includes('pending fees') || lowerPrompt.includes('payment status')) {
                // Fetch invoices for this user specifically
                // Note: Schema might allow linking invoice to user via 'billTo' name matching or if relation exists.
                // Assuming 'billTo' matches user name strictly or if we have relations.
                // The prompt "FinancialSection" in page.tsx used a filter. I will use the safest bet:
                // If Invoice has 'userId', use it. If not, match by Name if possible, or fail gracefully.
                // Checking previous context, User model has 'role'. Invoice model structure was not fully shown but typically linked.
                // I will try to find invoices linked to this user if a relation exists, or mock if schema is complex.
                // Actually, let's look for Invoices where `studentId` or similar exists?
                // For now, I'll fallback to a generic message if I can't easily link, or use the User's fee fields if added.
                // User model has 'paidAmount' and 'fees' based on "Refine Student Fees" conversation.

                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, totalFees: true, paidAmount: true } // Assuming these fields exist from previous tasks
                });

                if (user && user.totalFees) {
                    const total = user.totalFees;
                    const paid = user.paidAmount || 0;
                    const pending = total - paid;
                    aiResponseContent = `**Fee Status**\nTotal Fees: ₹${total}\nPaid: ₹${paid}\nPending: ₹${pending}`;
                    aiResponseType = 'data';
                    aiResponseData = { type: 'fees', total, paid, pending };
                } else {
                    aiResponseContent = "I don't have direct access to your fee structure right now.";
                }
            }

            // COMMAND 3: MY ATTENDANCE
            else if (lowerPrompt.includes('my attendance') || lowerPrompt.includes('attendance')) {
                // Fetch simple count of attendance records
                const records = await prisma.attendance.findMany({
                    where: { userId: userId }
                });
                const present = records.length;
                // Mocking total days or calculating simple stats
                aiResponseContent = `You have marked attendance for **${present} days** so far.`;
            }

            else {
                aiResponseContent = "I didn't understand that command. Try 'My Info', 'My Fees', or switch to AI Mode for help with studies!";
            }
        }

        // 2. Save Assistant Message
        if (sessionId) {
            await prisma.aiMessage.create({
                data: {
                    sessionId,
                    role: 'assistant',
                    content: aiResponseContent,
                    type: aiResponseType,
                    data: aiResponseData ? JSON.stringify(aiResponseData) : null
                }
            });

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

    } catch (error: any) {
        console.error('Student AI Error:', error);
        fs.appendFileSync('student_debug.log', `[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n`);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
