import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [
    totalPersonas,
    activePersonas,
    totalContent,
    publishedContent,
    totalCampaigns,
    totalOrders,
    revenueResult,
    recentContent,
  ] = await Promise.all([
    prisma.aIPersona.count(),
    prisma.aIPersona.count({ where: { status: "ACTIVE" } }),
    prisma.contentPiece.count(),
    prisma.contentPiece.count({ where: { status: "PUBLISHED" } }),
    prisma.campaign.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.contentPiece.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        views: true,
        likes: true,
        comments: true,
        shares: true,
        platform: true,
        publishedAt: true,
      },
    }),
  ]);

  const totalEngagement = recentContent.reduce(
    (acc, p) => ({
      views: acc.views + (p.views || 0),
      likes: acc.likes + (p.likes || 0),
      comments: acc.comments + (p.comments || 0),
      shares: acc.shares + (p.shares || 0),
    }),
    { views: 0, likes: 0, comments: 0, shares: 0 }
  );

  return NextResponse.json({
    personas: { total: totalPersonas, active: activePersonas },
    content: { total: totalContent, published: publishedContent },
    campaigns: { total: totalCampaigns },
    revenue: {
      total: (revenueResult._sum.amount || 0) / 100,
      orders: totalOrders,
    },
    engagement: totalEngagement,
    recentContent,
  });
}
