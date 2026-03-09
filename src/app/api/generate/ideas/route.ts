import { NextRequest, NextResponse } from "next/server";
import * as contentGenerator from "@/lib/services/content-generator";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.personaName || !body.niche) {
    return NextResponse.json(
      { error: "personaName and niche are required" },
      { status: 400 }
    );
  }

  try {
    const ideas = await contentGenerator.generateContentIdeas(
      body.personaName,
      body.niche,
      body.count || 10
    );
    return NextResponse.json(ideas);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Idea generation failed" },
      { status: 500 }
    );
  }
}
