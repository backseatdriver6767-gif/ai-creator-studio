import jwt from "jsonwebtoken";

const BASE_URL = "https://api.klingai.com/v1";

// JWT token cache
let cachedToken: string | null = null;
let tokenExpiry = 0;

function generateToken(): string {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid (with 5-min buffer)
  if (cachedToken && tokenExpiry > now + 300) {
    return cachedToken;
  }

  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error("KLING_ACCESS_KEY and KLING_SECRET_KEY are required");
  }

  const expiry = now + 1800; // 30 minutes
  const payload = {
    iss: accessKey,
    exp: expiry,
    nbf: now - 5,
  };

  cachedToken = jwt.sign(payload, secretKey, {
    algorithm: "HS256",
    header: { alg: "HS256", typ: "JWT" },
  });
  tokenExpiry = expiry;
  return cachedToken;
}

function headers() {
  return {
    Authorization: `Bearer ${generateToken()}`,
    "Content-Type": "application/json",
  };
}

// Kling API returns tasks in a wrapper: { code: 0, data: { task_id, task_status, ... } }
interface KlingApiResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    task_status: "submitted" | "processing" | "succeed" | "failed";
    task_status_msg?: string;
    task_result?: {
      videos?: Array<{
        id: string;
        url: string;
        duration: string;
      }>;
    };
  };
}

export interface KlingJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
  progress?: number;
}

function mapResponse(res: KlingApiResponse): KlingJob {
  const data = res.data;
  const statusMap: Record<string, KlingJob["status"]> = {
    submitted: "queued",
    processing: "processing",
    succeed: "completed",
    failed: "failed",
  };
  return {
    id: data.task_id,
    status: statusMap[data.task_status] || "processing",
    video_url: data.task_result?.videos?.[0]?.url,
    error: data.task_status === "failed" ? (data.task_status_msg || "Generation failed") : undefined,
  };
}

export interface TextToVideoOptions {
  prompt: string;
  negative_prompt?: string;
  duration?: number; // 5 or 10 seconds (15 for v3)
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  mode?: "std" | "pro";
  model?: string;
}

export interface ImageToVideoOptions {
  image_url: string;
  prompt: string;
  negative_prompt?: string;
  duration?: number;
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  mode?: "std" | "pro";
}

export async function textToVideo(options: TextToVideoOptions): Promise<KlingJob> {
  const res = await fetch(`${BASE_URL}/videos/text2video`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model_name: options.model || "kling-v2-6",
      prompt: options.prompt,
      negative_prompt: options.negative_prompt,
      duration: String(options.duration || 5),
      aspect_ratio: options.aspect_ratio || "9:16",
      mode: options.mode || "std",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kling textToVideo failed (${res.status}): ${body}`);
  }
  const json: KlingApiResponse = await res.json();
  if (json.code !== 0) throw new Error(`Kling error: ${json.message}`);
  return mapResponse(json);
}

export async function imageToVideo(options: ImageToVideoOptions): Promise<KlingJob> {
  const res = await fetch(`${BASE_URL}/videos/image2video`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model_name: "kling-v2-6",
      image: options.image_url,
      prompt: options.prompt,
      negative_prompt: options.negative_prompt,
      duration: String(options.duration || 5),
      aspect_ratio: options.aspect_ratio || "9:16",
      mode: options.mode || "std",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kling imageToVideo failed (${res.status}): ${body}`);
  }
  const json: KlingApiResponse = await res.json();
  if (json.code !== 0) throw new Error(`Kling error: ${json.message}`);
  return mapResponse(json);
}

export interface LipSyncOptions {
  video_url: string;
  audio_url: string; // Must be publicly accessible
}

export async function lipSync(options: LipSyncOptions): Promise<KlingJob> {
  const res = await fetch(`${BASE_URL}/videos/lip-sync`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      input: {
        video_url: options.video_url,
        audio_url: options.audio_url,
        audio_type: "url",
        mode: "audio2video",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kling lipSync failed (${res.status}): ${body}`);
  }
  const json: KlingApiResponse = await res.json();
  if (json.code !== 0) throw new Error(`Kling error: ${json.message}`);
  return mapResponse(json);
}

export async function getLipSyncStatus(taskId: string): Promise<KlingJob> {
  const res = await fetch(`${BASE_URL}/videos/lip-sync/${taskId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kling getLipSyncStatus failed (${res.status}): ${body}`);
  }
  const json: KlingApiResponse = await res.json();
  if (json.code !== 0) throw new Error(`Kling error: ${json.message}`);
  return mapResponse(json);
}

export async function getJobStatus(taskId: string): Promise<KlingJob> {
  const res = await fetch(`${BASE_URL}/videos/text2video/${taskId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    // Try image2video endpoint if text2video fails
    const res2 = await fetch(`${BASE_URL}/videos/image2video/${taskId}`, {
      headers: headers(),
    });
    if (!res2.ok) {
      const body = await res2.text();
      throw new Error(`Kling getJobStatus failed (${res2.status}): ${body}`);
    }
    const json: KlingApiResponse = await res2.json();
    if (json.code !== 0) throw new Error(`Kling error: ${json.message}`);
    return mapResponse(json);
  }
  const json: KlingApiResponse = await res.json();
  if (json.code !== 0) throw new Error(`Kling error: ${json.message}`);
  return mapResponse(json);
}
