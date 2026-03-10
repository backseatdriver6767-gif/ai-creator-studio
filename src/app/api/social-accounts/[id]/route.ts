import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const account = await prisma.socialAccount.update({
      where: { id },
      data: {
        personaId: body.personaId,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update social account" },
      { status: 500 }
    );
  }
}
