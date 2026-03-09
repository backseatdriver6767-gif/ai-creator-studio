const BASE_URL = "https://api.arcads.ai/api/v1";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function authenticate(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.ARCADS_CLIENT_ID!,
      client_secret: process.env.ARCADS_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Arcads auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

async function authHeaders() {
  const token = await authenticate();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export interface ArcadsActor {
  id: string;
  name: string;
  gender: string;
  thumbnail_url: string;
  preview_url?: string;
}

export interface ArcadsProduct {
  id: string;
  name: string;
  description?: string;
}

export interface ArcadsVideo {
  id: string;
  status: string;
  download_url?: string;
  duration?: number;
}

export async function listActors(): Promise<ArcadsActor[]> {
  const res = await fetch(`${BASE_URL}/actors`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Arcads listActors failed: ${res.status}`);
  const data = await res.json();
  return data.actors || data;
}

export async function createProduct(
  name: string,
  description?: string
): Promise<ArcadsProduct> {
  const res = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error(`Arcads createProduct failed: ${res.status}`);
  return res.json();
}

export async function createScript(
  productId: string,
  script: string,
  actorId: string
): Promise<{ id: string }> {
  const res = await fetch(`${BASE_URL}/products/${productId}/scripts`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ script, actor_id: actorId }),
  });
  if (!res.ok) throw new Error(`Arcads createScript failed: ${res.status}`);
  return res.json();
}

export async function generateVideo(scriptId: string): Promise<ArcadsVideo> {
  const res = await fetch(`${BASE_URL}/scripts/${scriptId}/generate`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Arcads generateVideo failed: ${res.status}`);
  return res.json();
}

export async function getVideoStatus(videoId: string): Promise<ArcadsVideo> {
  const res = await fetch(`${BASE_URL}/videos/${videoId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Arcads getVideoStatus failed: ${res.status}`);
  return res.json();
}

export async function downloadVideo(videoId: string): Promise<string> {
  const video = await getVideoStatus(videoId);
  if (!video.download_url) throw new Error("Video not ready for download");
  return video.download_url;
}
