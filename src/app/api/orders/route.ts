import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const productId = searchParams.get("productId");
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      ...(productId && { productId }),
      ...(status && { status: status as never }),
    },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true } } },
    take: 100,
  });

  return NextResponse.json(orders);
}
