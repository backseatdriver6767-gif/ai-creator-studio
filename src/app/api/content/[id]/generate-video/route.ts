import { NextRequest, NextResponse } from "next/server";
import { generateVideo, generateVideoWithHeyGen } from "@/lib/engines/content-pipeline";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const provider = body.provider || "kling"; // Default to Kling for backward compatibility

  try {
    let result;

    if (provider === "heygen") {
      result = await generateVideoWithHeyGen(id);
    } else {
      result = await generateVideo(id);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video generation failed" },
      { status: 500 }
    );
  }
}
