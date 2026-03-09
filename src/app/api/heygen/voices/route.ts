import { NextResponse } from "next/server";
import * as heygen from "@/lib/services/heygen";

// GET /api/heygen/voices - List all available HeyGen voices
export async function GET() {
  try {
    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: "HeyGen API key not configured" },
        { status: 400 }
      );
    }

    const voices = await heygen.listVoices();
    return NextResponse.json({ voices });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
