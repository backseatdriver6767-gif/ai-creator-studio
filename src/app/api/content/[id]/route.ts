import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const piece = await prisma.contentPiece.findUnique({
    where: { id },
    include: {
      persona: true,
      campaign: {
        include: { products: true },
      },
    },
  });

  if (!piece) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(piece);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const piece = await prisma.contentPiece.update({
    where: { id },
    data: {
      title: body.title,
      caption: body.caption,
      type: body.type,
      format: body.format,
      platform: body.platform,
      duration: body.duration,
      aspectRatio: body.aspectRatio,
      status: body.status,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      campaignId: body.campaignId !== undefined ? body.campaignId : undefined,
    },
  });

  return NextResponse.json(piece);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contentPiece.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
