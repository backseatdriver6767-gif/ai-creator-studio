import { NextRequest, NextResponse } from "next/server";
import * as contentGenerator from "@/lib/services/content-generator";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.personaName || !body.topic) {
    return NextResponse.json(
      { error: "personaName and topic are required" },
      { status: 400 }
    );
  }

  try {
    const script = await contentGenerator.generateScript(
      body.personaName,
      body.personaDescription || "",
      body.contentType || "REEL",
      body.topic,
      body.niche || "general",
      {
        duration: body.duration,
        platform: body.platform,
      }
    );
    return NextResponse.json(script);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Script generation failed" },
      { status: 500 }
    );
  }
}
