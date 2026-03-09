// Late.dev (getlate.dev) unified social posting API
const BASE_URL = "https://api.getlate.dev/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.LATE_API_KEY!}`,
    "Content-Type": "application/json",
  };
}

export interface LatePost {
  id: string;
  status: string;
  platforms: LatePostPlatform[];
  created_at: string;
}

export interface LatePostPlatform {
  platform: string;
  post_id?: string;
  status: string;
  url?: string;
  error?: string;
}

export interface PostContentOptions {
  platforms: string[]; // ["instagram", "tiktok", "youtube"]
  caption: string;
  media_urls: string[]; // URLs to video/image files
  media_type?: "video" | "image";
  hashtags?: string[];
  first_comment?: string;
}

export interface SchedulePostOptions extends PostContentOptions {
  scheduled_at: string; // ISO 8601
}

export interface LateAnalytics {
  post_id: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach?: number;
  impressions?: number;
}

export async function postContent(options: PostContentOptions): Promise<LatePost> {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      platforms: options.platforms,
      caption: options.caption,
      media_urls: options.media_urls,
      media_type: options.media_type || "video",
      hashtags: options.hashtags,
      first_comment: options.first_comment,
    }),
  });
  if (!res.ok) throw new Error(`Late postContent failed: ${res.status}`);
  return res.json();
}

export async function schedulePost(options: SchedulePostOptions): Promise<LatePost> {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      platforms: options.platforms,
      caption: options.caption,
      media_urls: options.media_urls,
      media_type: options.media_type || "video",
      hashtags: options.hashtags,
      first_comment: options.first_comment,
      scheduled_at: options.scheduled_at,
    }),
  });
  if (!res.ok) throw new Error(`Late schedulePost failed: ${res.status}`);
  return res.json();
}

export async function getPostStatus(postId: string): Promise<LatePost> {
  const res = await fetch(`${BASE_URL}/posts/${postId}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Late getPostStatus failed: ${res.status}`);
  return res.json();
}

export async function getAnalytics(postId: string): Promise<LateAnalytics[]> {
  const res = await fetch(`${BASE_URL}/posts/${postId}/analytics`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Late getAnalytics failed: ${res.status}`);
  return res.json();
}

export async function listAccounts(): Promise<
  { id: string; platform: string; username: string }[]
> {
  const res = await fetch(`${BASE_URL}/accounts`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Late listAccounts failed: ${res.status}`);
  return res.json();
}
