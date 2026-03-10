import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const personaId = searchParams.get("personaId");
  const status = searchParams.get("status");
  const campaignId = searchParams.get("campaignId");

  const pieces = await prisma.contentPiece.findMany({
    where: {
      ...(personaId && { personaId }),
      ...(status && { status: status as never }),
      ...(campaignId && { campaignId }),
    },
    orderBy: { createdAt: "desc" },
    include: { persona: { select: { id: true, name: true } } },
  });

  return NextResponse.json(pieces);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const piece = await prisma.contentPiece.create({
    data: {
      personaId: body.personaId,
      title: body.title,
      caption: body.caption,
      type: body.type,
      format: body.format || "VIDEO",
      platform: body.platform,
      duration: body.duration,
      aspectRatio: body.aspectRatio,
      campaignId: body.campaignId,
      status: "DRAFT",
    },
  });

  return NextResponse.json(piece, { status: 201 });
}
