import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1]; // Bearer <token>

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');
        await jwtVerify(token, secret);

        // If verified
        const response = NextResponse.json({ authenticated: true });

        // Prevent caching of this check
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;

    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
