import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Handle Late.dev webhook events for posting confirmations
  if (body.event === "post.completed" && body.post_id) {
    // Find content piece by matching postIds
    const pieces = await prisma.contentPiece.findMany({
      where: { status: "SCHEDULED" },
    });

    for (const piece of pieces) {
      const postIds = piece.postIds as Record<string, unknown> | null;
      if (postIds && JSON.stringify(postIds).includes(body.post_id)) {
        await prisma.contentPiece.update({
          where: { id: piece.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });
        break;
      }
    }
  }

  return NextResponse.json({ received: true });
}
