import { NextResponse } from "next/server";
import * as heygen from "@/lib/services/heygen";

// GET /api/heygen/avatars - List all available HeyGen avatars
export async function GET() {
  try {
    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: "HeyGen API key not configured" },
        { status: 400 }
      );
    }

    const avatars = await heygen.listAvatars();
    return NextResponse.json({ avatars });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch avatars" },
      { status: 500 }
    );
  }
}
