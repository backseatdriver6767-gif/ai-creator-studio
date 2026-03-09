// HeyGen API wrapper for AI video generation
// HeyGen handles both video avatars and voice synthesis internally

const BASE_URL = "https://api.heygen.com/v2";

function headers() {
  return {
    "X-Api-Key": process.env.HEYGEN_API_KEY!,
    "Content-Type": "application/json",
  };
}

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  preview_video_url?: string;
  gender?: string;
  is_public?: boolean;
}

export interface HeyGenVoice {
  voice_id: string;
  voice_name: string;
  language: string;
  gender?: string;
  preview_audio?: string;
}

export interface HeyGenVideo {
  video_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
}

export interface CreateVideoOptions {
  script: string;
  avatar_id: string;
  voice_id?: string;
  title?: string;
  test?: boolean; // for test mode (shorter queue times, watermark)
}

/**
 * List all available avatars
 */
export async function listAvatars(): Promise<HeyGenAvatar[]> {
  const res = await fetch(`${BASE_URL}/avatars`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`HeyGen listAvatars failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.data?.avatars || data.avatars || [];
}

/**
 * List all available voices
 */
export async function listVoices(): Promise<HeyGenVoice[]> {
  const res = await fetch(`${BASE_URL}/voices`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`HeyGen listVoices failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.data?.voices || data.voices || [];
}

/**
 * Create a video with the specified avatar, script, and voice
 */
export async function createVideo(options: CreateVideoOptions): Promise<HeyGenVideo> {
  const payload = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: options.avatar_id,
          avatar_style: "normal",
        },
        voice: options.voice_id
          ? {
              type: "text",
              input_text: options.script,
              voice_id: options.voice_id,
            }
          : {
              type: "text",
              input_text: options.script,
            },
      },
    ],
    dimension: {
      width: 1080,
      height: 1920, // 9:16 aspect ratio for Reels/TikTok/Stories
    },
    test: options.test ?? false,
    title: options.title,
  };

  const res = await fetch(`${BASE_URL}/video/generate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`HeyGen createVideo failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return {
    video_id: data.data?.video_id || data.video_id,
    status: "pending",
  };
}

/**
 * Get video status and URL when ready
 */
export async function getVideoStatus(videoId: string): Promise<HeyGenVideo> {
  const res = await fetch(`${BASE_URL}/video_status.get?video_id=${videoId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`HeyGen getVideoStatus failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const videoData = data.data || data;

  return {
    video_id: videoId,
    status: mapStatus(videoData.status),
    video_url: videoData.video_url,
    thumbnail_url: videoData.thumbnail_url,
    duration: videoData.duration,
    error: videoData.error,
  };
}

/**
 * Poll for video completion (helper function)
 */
export async function waitForVideo(
  videoId: string,
  maxAttempts: number = 60,
  intervalMs: number = 10000
): Promise<HeyGenVideo> {
  for (let i = 0; i < maxAttempts; i++) {
    const video = await getVideoStatus(videoId);

    if (video.status === "completed") {
      return video;
    }

    if (video.status === "failed") {
      throw new Error(`HeyGen video generation failed: ${video.error}`);
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("HeyGen video generation timed out");
}

/**
 * Delete a video
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/video.delete?video_id=${videoId}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`HeyGen deleteVideo failed: ${res.status} ${await res.text()}`);
  }
}

// Helper to map HeyGen status to our standard format
function mapStatus(heygenStatus: string): HeyGenVideo["status"] {
  const statusMap: Record<string, HeyGenVideo["status"]> = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed",
    error: "failed",
  };
  return statusMap[heygenStatus.toLowerCase()] || "processing";
}
