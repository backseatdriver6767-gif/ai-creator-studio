// Late.dev API wrapper for TikTok, YouTube, and other social platforms
// Documentation: https://developers.getlate.dev

const BASE_URL = "https://api.getlate.dev/v1";

function headers() {
  return {
    "Authorization": `Bearer ${process.env.LATE_API_KEY!}`,
    "Content-Type": "application/json",
  };
}

export interface LateAccount {
  id: string;
  platform: "tiktok" | "youtube" | "linkedin" | "twitter" | "instagram";
  username: string;
  display_name?: string;
  profile_image?: string;
  is_active: boolean;
}

export interface LatePost {
  id: string;
  status: "scheduled" | "publishing" | "published" | "failed";
  platform: string;
  account_id: string;
  post_url?: string;
  scheduled_at?: string;
  published_at?: string;
  error?: string;
}

export interface CreatePostOptions {
  account_id: string;
  video_url: string;
  caption?: string;
  title?: string; // For YouTube
  privacy?: "public" | "private" | "unlisted"; // For YouTube
  schedule_at?: string; // ISO 8601 timestamp
  hashtags?: string[];
}

export interface TikTokPostOptions {
  account_id: string;
  video_url: string;
  caption: string;
  privacy_level?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  disable_duet?: boolean;
  disable_stitch?: boolean;
  disable_comment?: boolean;
  schedule_at?: string;
}

export interface YouTubePostOptions {
  account_id: string;
  video_url: string;
  title: string;
  description?: string;
  privacy: "public" | "private" | "unlisted";
  category_id?: string;
  tags?: string[];
  schedule_at?: string;
}

/**
 * Get all connected accounts
 */
export async function getAccounts(): Promise<LateAccount[]> {
  const res = await fetch(`${BASE_URL}/accounts`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Late.dev getAccounts failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.data || data.accounts || [];
}

/**
 * Get accounts filtered by platform
 */
export async function getAccountsByPlatform(platform: string): Promise<LateAccount[]> {
  const accounts = await getAccounts();
  return accounts.filter(acc => acc.platform === platform && acc.is_active);
}

/**
 * Post to TikTok
 */
export async function postToTikTok(options: TikTokPostOptions): Promise<LatePost> {
  const payload = {
    account_id: options.account_id,
    video_url: options.video_url,
    caption: options.caption,
    privacy_level: options.privacy_level || "PUBLIC_TO_EVERYONE",
    disable_duet: options.disable_duet ?? false,
    disable_stitch: options.disable_stitch ?? false,
    disable_comment: options.disable_comment ?? false,
    schedule_at: options.schedule_at,
  };

  const res = await fetch(`${BASE_URL}/posts/tiktok`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Late.dev TikTok post failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.data?.id || data.id,
    status: data.data?.status || data.status || "scheduled",
    platform: "tiktok",
    account_id: options.account_id,
    scheduled_at: options.schedule_at,
  };
}

/**
 * Post to YouTube
 */
export async function postToYouTube(options: YouTubePostOptions): Promise<LatePost> {
  const payload = {
    account_id: options.account_id,
    video_url: options.video_url,
    title: options.title,
    description: options.description || "",
    privacy: options.privacy,
    category_id: options.category_id || "22", // People & Blogs
    tags: options.tags || [],
    schedule_at: options.schedule_at,
  };

  const res = await fetch(`${BASE_URL}/posts/youtube`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Late.dev YouTube post failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return {
    id: data.data?.id || data.id,
    status: data.data?.status || data.status || "scheduled",
    platform: "youtube",
    account_id: options.account_id,
    post_url: data.data?.post_url || data.post_url,
    scheduled_at: options.schedule_at,
  };
}

/**
 * Get post status
 */
export async function getPostStatus(postId: string): Promise<LatePost> {
  const res = await fetch(`${BASE_URL}/posts/${postId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Late.dev getPostStatus failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const post = data.data || data;

  return {
    id: postId,
    status: mapStatus(post.status),
    platform: post.platform,
    account_id: post.account_id,
    post_url: post.post_url,
    scheduled_at: post.scheduled_at,
    published_at: post.published_at,
    error: post.error,
  };
}

/**
 * Poll for post completion (helper function)
 */
export async function waitForPost(
  postId: string,
  maxAttempts: number = 30,
  intervalMs: number = 5000
): Promise<LatePost> {
  for (let i = 0; i < maxAttempts; i++) {
    const post = await getPostStatus(postId);

    if (post.status === "published") {
      return post;
    }

    if (post.status === "failed") {
      throw new Error(`Post publishing failed: ${post.error}`);
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Post publishing timed out");
}

/**
 * Delete/cancel a scheduled post
 */
export async function deletePost(postId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Late.dev deletePost failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Get all posts
 */
export async function getPosts(limit: number = 50): Promise<LatePost[]> {
  const res = await fetch(`${BASE_URL}/posts?limit=${limit}`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Late.dev getPosts failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.data || data.posts || [];
}

// Helper to map Late.dev status to our standard format
function mapStatus(lateStatus: string): LatePost["status"] {
  const statusMap: Record<string, LatePost["status"]> = {
    scheduled: "scheduled",
    publishing: "publishing",
    published: "published",
    posted: "published",
    failed: "failed",
    error: "failed",
  };
  return statusMap[lateStatus.toLowerCase()] || "scheduled";
}
