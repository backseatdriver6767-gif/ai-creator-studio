// Direct Instagram Graph API integration for Content Publishing
// Uses Meta Graph API v21.0 for Reels publishing

const GRAPH_API = "https://graph.facebook.com/v21.0";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- OAuth Flow ----

export function getOAuthUrl(appId: string, redirectUri: string, state?: string): string {
  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    ...(state ? { state } : {}),
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(
    `${GRAPH_API}/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      })
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to exchange code for token");
  }
  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function getLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(
    `${GRAPH_API}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      })
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to get long-lived token");
  }
  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function refreshLongLivedToken(
  currentToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?` +
      new URLSearchParams({
        grant_type: "ig_refresh_token",
        access_token: currentToken,
      })
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to refresh token");
  }
  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// ---- Account Discovery ----

export async function getInstagramAccountFromPages(
  accessToken: string
): Promise<{ igUserId: string; igUsername: string; pageId: string; pageName: string }[]> {
  const res = await fetch(
    `${GRAPH_API}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${accessToken}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to get pages");
  }
  const data = await res.json();

  console.log("[IG Discovery] Pages response:", JSON.stringify(data));

  const accounts: { igUserId: string; igUsername: string; pageId: string; pageName: string }[] = [];

  for (const page of data.data || []) {
    console.log("[IG Discovery] Page:", page.name, "IG account:", page.instagram_business_account || "NONE");
    if (page.instagram_business_account) {
      accounts.push({
        igUserId: page.instagram_business_account.id,
        igUsername: page.instagram_business_account.username || "",
        pageId: page.id,
        pageName: page.name,
      });
    }
  }

  return accounts;
}

// ---- Content Publishing ----

export interface PublishReelOptions {
  igUserId: string;
  accessToken: string;
  videoUrl: string; // Must be publicly accessible HTTPS URL
  caption?: string;
  shareToFeed?: boolean;
  thumbOffset?: number; // Milliseconds
}

export async function createReelContainer(
  options: PublishReelOptions
): Promise<{ containerId: string }> {
  const params = new URLSearchParams({
    media_type: "REELS",
    video_url: options.videoUrl,
    access_token: options.accessToken,
    share_to_feed: String(options.shareToFeed ?? true),
  });

  if (options.caption) params.set("caption", options.caption);
  if (options.thumbOffset) params.set("thumb_offset", String(options.thumbOffset));

  const res = await fetch(`${GRAPH_API}/${options.igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to create reel container");
  }

  const data = await res.json();
  return { containerId: data.id };
}

export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED";

export async function getContainerStatus(
  containerId: string,
  accessToken: string
): Promise<{ status: ContainerStatus; errorMessage?: string }> {
  const res = await fetch(
    `${GRAPH_API}/${containerId}?fields=status_code,status&access_token=${accessToken}`
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to get container status");
  }

  const data = await res.json();
  return {
    status: data.status_code as ContainerStatus,
    errorMessage: data.status,
  };
}

export async function publishContainer(
  igUserId: string,
  containerId: string,
  accessToken: string
): Promise<{ mediaId: string }> {
  const res = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Failed to publish reel");
  }

  const data = await res.json();
  return { mediaId: data.id };
}

// ---- High-Level Publish Function ----

export async function publishReel(
  options: PublishReelOptions,
  maxWaitMs: number = 120000 // 2 minutes max wait for processing
): Promise<{ mediaId: string; containerId: string }> {
  // Step 1: Create container
  const { containerId } = await createReelContainer(options);

  // Step 2: Poll until ready
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    await sleep(5000); // Wait 5 seconds between polls

    const { status, errorMessage } = await getContainerStatus(
      containerId,
      options.accessToken
    );

    if (status === "FINISHED") {
      // Step 3: Publish
      const { mediaId } = await publishContainer(
        options.igUserId,
        containerId,
        options.accessToken
      );
      return { mediaId, containerId };
    }

    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Reel container ${status}: ${errorMessage || "unknown error"}`);
    }
  }

  throw new Error("Timed out waiting for reel container to process");
}

// ---- Insights ----

export async function getMediaInsights(
  mediaId: string,
  accessToken: string
): Promise<{ views: number; likes: number; comments: number; shares: number }> {
  const res = await fetch(
    `${GRAPH_API}/${mediaId}/insights?metric=plays,likes,comments,shares&access_token=${accessToken}`
  );

  if (!res.ok) {
    // Insights may not be available yet
    return { views: 0, likes: 0, comments: 0, shares: 0 };
  }

  const data = await res.json();
  const metrics: Record<string, number> = {};

  for (const item of data.data || []) {
    metrics[item.name] = item.values?.[0]?.value || 0;
  }

  return {
    views: metrics.plays || 0,
    likes: metrics.likes || 0,
    comments: metrics.comments || 0,
    shares: metrics.shares || 0,
  };
}
