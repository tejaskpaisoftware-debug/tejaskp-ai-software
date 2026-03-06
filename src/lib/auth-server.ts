import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-this";

export async function getAuthUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) return null;

        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        return payload as { userId: string; role: string; name: string };
    } catch (error) {
        return null;
    }
}

export async function restrictToAdmin() {
    const user = await getAuthUser();

    if (!user || (user.role !== "ADMIN" && user.role !== "DEVELOPMENT_MANAGER")) {
        return {
            authorized: false,
            response: NextResponse.json(
                { message: "Access Denied: Administrative privileges required." },
                { status: 403 }
            )
        };
    }

    return { authorized: true, user };
}
