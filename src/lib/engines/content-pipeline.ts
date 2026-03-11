import { prisma } from "@/lib/prisma";
import { PipelineStatus } from "@/generated/prisma/client";
import * as lateSocial from "@/lib/services/late-social";
import * as instagram from "@/lib/services/instagram";
import * as manychat from "@/lib/services/manychat";

// ============================================================
// Pipeline: Upload Video -> Publish (Instagram/TikTok/YouTube)
// Users create videos in HeyGen, download MP4, upload here.
// ============================================================

export async function publishContent(
  contentPieceId: string,
  scheduledAt?: Date
) {
  const piece = await prisma.contentPiece.findUniqueOrThrow({
    where: { id: contentPieceId },
    include: { persona: true },
  });

  if (!piece.videoUrl) {
    throw new Error("No video uploaded. Upload a video first.");
  }

  if (piece.status !== "VIDEO_UPLOADED" && piece.status !== "SCHEDULED" && piece.status !== "DRAFT") {
    // Allow re-publishing from these statuses
  }

  const caption = piece.caption || piece.title;
  const postIds: Record<string, unknown> = {};

  if (scheduledAt) {
    await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: {
        status: PipelineStatus.SCHEDULED,
        scheduledAt,
      },
    });
    return { scheduled: true, scheduledAt };
  }

  for (const platform of piece.platform) {
    if (platform === "INSTAGRAM") {
      const igAccount = await prisma.socialAccount.findFirst({
        where: {
          personaId: piece.personaId,
          platform: "INSTAGRAM",
          accessToken: { not: null },
        },
      });

      if (!igAccount || !igAccount.accessToken || !igAccount.accountId) {
        throw new Error(
          "No Instagram account connected for this persona. Go to Settings > Social Accounts to connect."
        );
      }

      if (igAccount.tokenExpiry && igAccount.tokenExpiry < new Date()) {
        throw new Error(
          "Instagram token expired. Please reconnect your Instagram account in Settings."
        );
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const videoUrl = piece.videoUrl.startsWith("http")
        ? piece.videoUrl
        : `${appUrl}${piece.videoUrl}`;

      const result = await instagram.publishReel({
        igUserId: igAccount.accountId,
        accessToken: igAccount.accessToken,
        videoUrl,
        caption,
        shareToFeed: true,
      });

      postIds.instagram = {
        mediaId: result.mediaId,
        containerId: result.containerId,
      };
    } else if (process.env.LATE_API_KEY) {
      try {
        const result = await lateSocial.postContent({
          platforms: [platform.toLowerCase()],
          caption,
          media_urls: [piece.videoUrl || piece.thumbnailUrl || ""],
          media_type: piece.format === "VIDEO" ? "video" : "image",
        });
        postIds[platform.toLowerCase()] = result;
      } catch (err) {
        postIds[platform.toLowerCase()] = {
          error: err instanceof Error ? err.message : "Failed",
        };
      }
    }
  }

  await prisma.contentPiece.update({
    where: { id: contentPieceId },
    data: {
      status: PipelineStatus.PUBLISHED,
      publishedAt: new Date(),
      postIds: JSON.parse(JSON.stringify(postIds)),
    },
  });

  // Auto-create ManyChat keyword automation if campaign has keyword + checkout URL
  if (piece.campaignId && manychat.isConfigured()) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: piece.campaignId },
      include: { products: { take: 1 } },
    });

    if (campaign?.manychatKeyword) {
      const checkoutUrl =
        campaign.checkoutUrl ||
        campaign.productUrl ||
        campaign.products[0]?.checkoutUrl;

      if (checkoutUrl) {
        const mcResult = await manychat.createKeywordAutomation({
          keyword: campaign.manychatKeyword,
          checkoutUrl,
        });
        postIds.manychat = mcResult;
      }
    }
  }

  return postIds;
}
