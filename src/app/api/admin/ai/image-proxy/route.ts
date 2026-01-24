
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const prompt = searchParams.get('prompt');

        if (!prompt) {
            return new NextResponse('Prompt is required', { status: 400 });
        }

        // Use 'flux' model for high-quality, "deep" prompt adherence.
        // Requesting HD resolution (1080p approx) for better quality.
        const targetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1920&height=1080&seed=${Date.now()}&nologo=true&enhance=true`;

        const response = await fetch(targetUrl, {
            headers: {
                // Emulate a generic tool or no-referrer request to bypass hotlink protection
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // 'Referer': 'https://pollinations.ai/' // Sometimes helps, sometimes hurts. Empty is often better for APIs acting as direct tools.
            }
        });

        if (!response.ok) {
            console.error("Pollinations Proxy Error:", response.status, response.statusText);
            return new NextResponse('Error fetching image', { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=3600'
            }
        });

    } catch (error) {
        console.error("Image Proxy Error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
