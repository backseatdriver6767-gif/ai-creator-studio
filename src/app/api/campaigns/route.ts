import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const personaId = searchParams.get("personaId");
  const status = searchParams.get("status");

  const campaigns = await prisma.campaign.findMany({
    where: {
      ...(personaId && { personaId }),
      ...(status && { status: status as never }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      persona: { select: { id: true, name: true } },
      _count: { select: { contentPieces: true, products: true } },
    },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const campaign = await prisma.campaign.create({
    data: {
      personaId: body.personaId,
      name: body.name,
      description: body.description,
      niche: body.niche,
      productUrl: body.productUrl,
      checkoutUrl: body.checkoutUrl,
      manychatKeyword: body.manychatKeyword,
      contentIdeas: body.contentIdeas,
      postingSchedule: body.postingSchedule,
      platforms: body.platforms,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
