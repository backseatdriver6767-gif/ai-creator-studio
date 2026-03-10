import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = ["video/mp4", "video/quicktime"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const piece = await prisma.contentPiece.findUnique({ where: { id } });
  if (!piece) {
    return NextResponse.json({ error: "Content piece not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("video") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No video file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only MP4 and MOV are accepted." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 500MB." },
      { status: 400 }
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.type === "video/quicktime" ? "mov" : "mp4";
  const filename = `${id}.${ext}`;
  const filepath = path.join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const videoUrl = `/uploads/videos/${filename}`;

  const updated = await prisma.contentPiece.update({
    where: { id },
    data: {
      videoUrl,
      status: "VIDEO_UPLOADED",
    },
  });

  return NextResponse.json({ videoUrl, contentPiece: updated });
}
