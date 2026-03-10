import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      persona: true,
      contentPieces: { orderBy: { createdAt: "desc" } },
      products: { include: { _count: { select: { orders: true } } } },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      niche: body.niche,
      productUrl: body.productUrl,
      checkoutUrl: body.checkoutUrl,
      manychatKeyword: body.manychatKeyword,
      contentIdeas: body.contentIdeas,
      postingSchedule: body.postingSchedule,
      platforms: body.platforms,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    },
  });

  return NextResponse.json(campaign);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
