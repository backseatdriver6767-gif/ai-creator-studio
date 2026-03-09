import { NextResponse } from "next/server";
import * as elevenlabs from "@/lib/services/elevenlabs";

export async function GET() {
  try {
    const voices = await elevenlabs.listVoices();
    return NextResponse.json(voices);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list voices" },
      { status: 500 }
    );
  }
}
