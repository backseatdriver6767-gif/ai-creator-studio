import { NextRequest, NextResponse } from "next/server";
import * as elevenlabs from "@/lib/services/elevenlabs";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.prompt || !body.name) {
    return NextResponse.json(
      { error: "prompt and name are required" },
      { status: 400 }
    );
  }

  try {
    const voice = await elevenlabs.designVoice(body.prompt, body.name);
    return NextResponse.json(voice);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voice design failed" },
      { status: 500 }
    );
  }
}
