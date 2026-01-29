import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Fallback quotes in case AI fails or is slow
const FALLBACK_QUOTES = [
    { text: "Excellence is not a skill, it is an attitude.", author: "Ralph Marston" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
    { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" }
];

export async function POST(req: Request) {
    try {
        const { role, name, image } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY missing, using fallback.");
            const random = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
            return NextResponse.json({ quote: random.text, author: random.author });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        let promptParts: any[] = [];

        if (image) {
            // System Instruction for Visual Analysis - GREETING FOCUS
            promptParts.push(`You are a friendly AI assistant welcoming an employee named "${name}" to their dashboard.
             Analyze the provided image of them. Identify their expression, mood, and background.
             
             Generate a warm, short, and personalized GREETING (not a quote) based on the visual context.
             Examples:
             - "Great to see that smile, ${name}! Ready to conquer the day?" (if smiling)
             - "Love the sunny vibes in your background! Let's make today bright." (if outdoors/sunny)
             - "Looking sharp and professional! Let's get to work." (if formal)
             
             Keep it fresh, varied, and under 20 words.
             
             Return strictly JSON format: {"quote": "The greeting text", "author": "TejasKP AI"}
             Do not use markdown.`);

            // Extract base64
            const base64Data = image.split(',')[1];
            promptParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            });
        } else {
            // Text-only Fallback - GREETING FOCUS
            promptParts.push(`Generate a warm, professional, and energetic welcome greeting for "${name}". 
             Avoid generic "Welcome back". Make it sound alive and motivating.
             Max 15 words.
             Return strictly JSON format: {"quote": "The greeting text", "author": "TejasKP AI"}
             Do not use markdown.`);
        }

        const result = await model.generateContent(promptParts);
        const text = result.response.text();

        let data;
        try {
            // Clean markdown if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("AI JSON Parse Error", e);
            const random = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
            data = { quote: random.text, author: random.author };
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Quote Generation Error:", error);
        const random = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        return NextResponse.json({ quote: random.text, author: random.author });
    }
}
