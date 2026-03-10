import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const persona = await prisma.aIPersona.findUnique({
    where: { id },
    include: {
      contentPieces: { orderBy: { createdAt: "desc" }, take: 10 },
      campaigns: { orderBy: { createdAt: "desc" } },
      socialAccounts: true,
    },
  });

  if (!persona) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(persona);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const persona = await prisma.aIPersona.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      status: body.status,
    },
  });

  return NextResponse.json(persona);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.aIPersona.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
