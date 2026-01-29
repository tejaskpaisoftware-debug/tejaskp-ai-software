import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
        }

        const tasks = await prisma.task.findMany({
            where: { assignedToId: userId },
            include: {
                history: true,
                comments: {
                    orderBy: { createdAt: 'desc' }
                },
                attachments: true
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
        });

        return NextResponse.json({ success: true, tasks });
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { taskId, status, comment, fileName, fileUrl } = body;

        if (!taskId) {
            return NextResponse.json({ success: false, error: "Task ID required" }, { status: 400 });
        }

        // Prepare updates
        const updateData: any = {};
        if (status) updateData.status = status;

        // If status changed, log history
        let historyCreate: any = undefined;
        if (status) {
            historyCreate = {
                create: {
                    change: `Status updated to ${status}`,
                    updatedBy: "Employee"
                }
            };
        }

        // Add comment if provided
        let commentCreate: any = undefined;
        if (comment && body.userId) {
            commentCreate = {
                create: {
                    content: comment,
                    userId: body.userId
                }
            };
        }

        // Add attachment if provided
        let attachmentCreate: any = undefined;
        if (fileUrl && fileName) {
            attachmentCreate = {
                create: {
                    fileUrl,
                    fileName,
                    fileType: fileName.split('.').pop()
                }
            };
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...updateData,
                history: historyCreate,
                comments: commentCreate,
                attachments: attachmentCreate
            }
        });

        return NextResponse.json({ success: true, task: updatedTask });
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
