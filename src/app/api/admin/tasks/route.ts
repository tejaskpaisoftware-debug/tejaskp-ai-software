import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        const tasks = await prisma.task.findMany({
            where: userId ? { assignedToId: userId } : {},
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        photoUrl: true,
                        role: true
                    }
                },
                history: true,
                comments: {
                    orderBy: { createdAt: 'desc' }
                },
                attachments: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, projectName, priority, deadline, assignedToId } = body;

        if (!title || !assignedToId) {
            return NextResponse.json({ success: false, error: "Title and Assignee are required" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                projectName,
                priority,
                deadline,
                assignedToId,
                status: "TODO",
                history: {
                    create: {
                        change: "Task created and assigned",
                        updatedBy: "Admin"
                    }
                }
            }
        });

        return NextResponse.json({ success: true, task });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get("taskId");

        if (!taskId) {
            return NextResponse.json({ success: false, error: "Task ID is required" }, { status: 400 });
        }

        await prisma.task.delete({
            where: { id: taskId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
