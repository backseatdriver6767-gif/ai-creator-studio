import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const personas = await prisma.aIPersona.findMany({
    where: status ? { status: status as "DRAFT" | "ACTIVE" | "ARCHIVED" } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { contentPieces: true, campaigns: true } },
    },
  });

  return NextResponse.json(personas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const persona = await prisma.aIPersona.create({
    data: {
      name: body.name,
      description: body.description,
      status: body.status || "DRAFT",
    },
  });

  return NextResponse.json(persona, { status: 201 });
}
