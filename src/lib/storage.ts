import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { execFile } from "child_process";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

export async function saveFile(
  buffer: Buffer,
  filename: string,
  subfolder: string = "general"
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, subfolder);
  await ensureDir(dir);

  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = `${timestamp}-${safeName}`;
  const filePath = path.join(dir, finalName);

  await writeFile(filePath, buffer);

  // Return URL path relative to public/
  return `/uploads/${subfolder}/${finalName}`;
}

export async function saveAudio(buffer: Buffer, contentPieceId: string): Promise<string> {
  return saveFile(buffer, `${contentPieceId}.mp3`, "audio");
}

export async function saveVideo(buffer: Buffer, contentPieceId: string): Promise<string> {
  return saveFile(buffer, `${contentPieceId}.mp4`, "video");
}

export async function saveImage(buffer: Buffer, name: string): Promise<string> {
  return saveFile(buffer, name, "images");
}

export async function downloadAndSave(
  url: string,
  filename: string,
  subfolder: string
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return saveFile(buffer, filename, subfolder);
}

// Merge video + audio into a single mp4 using ffmpeg
export async function mergeVideoAudio(
  videoPath: string,
  audioPath: string,
  contentPieceId: string
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, "video");
  await ensureDir(dir);

  const timestamp = Date.now();
  const outputName = `${timestamp}-${contentPieceId}-final.mp4`;
  const outputPath = path.join(dir, outputName);

  // Resolve paths relative to public/ if they start with /uploads/
  const resolveLocal = (p: string) =>
    p.startsWith("/uploads/")
      ? path.join(process.cwd(), "public", p)
      : p;

  const absVideo = resolveLocal(videoPath);
  const absAudio = resolveLocal(audioPath);

  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-y",
        "-i", absVideo,
        "-i", absAudio,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        outputPath,
      ],
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`ffmpeg merge failed: ${stderr || error.message}`));
        } else {
          resolve(`/uploads/video/${outputName}`);
        }
      }
    );
  });
}
