import { prisma } from "@/lib/prisma";
import { PipelineStatus, JobType, JobStatus } from "@/generated/prisma/client";
import * as contentGenerator from "@/lib/services/content-generator";
import * as elevenlabs from "@/lib/services/elevenlabs";
import * as kling from "@/lib/services/kling";
import * as heygen from "@/lib/services/heygen";
import * as lateSocial from "@/lib/services/late-social";
import * as instagram from "@/lib/services/instagram";
import { saveAudio, downloadAndSave, mergeVideoAudio } from "@/lib/storage";

// ============================================================
// Pipeline: Script (Claude) -> Voice (ElevenLabs) -> Video (Kling) -> Publish (Instagram)
// Kling uses image-to-video with a reference image for consistent persona appearance.
// ElevenLabs provides consistent voice via a designed voice ID.
// ============================================================

// Step 1: Generate script via Claude
export async function generateScript(contentPieceId: string) {
  const piece = await prisma.contentPiece.findUniqueOrThrow({
    where: { id: contentPieceId },
    include: { persona: true },
  });

  await prisma.contentPiece.update({
    where: { id: contentPieceId },
    data: { status: PipelineStatus.SCRIPT_READY },
  });

  const result = await contentGenerator.generateScript(
    piece.persona.name,
    piece.persona.description || "",
    piece.type,
    piece.title,
    "general",
    { duration: piece.duration || 7, platform: piece.platform[0] }
  );

  await prisma.contentPiece.update({
    where: { id: contentPieceId },
    data: {
      script: result.script,
      duration: result.estimatedDuration,
      status: PipelineStatus.SCRIPT_READY,
      generationLog: {
        ...(piece.generationLog as Record<string, unknown> || {}),
        scriptGeneratedAt: new Date().toISOString(),
      },
    },
  });

  return result;
}

// Step 2: Generate voice via ElevenLabs
export async function generateVoice(contentPieceId: string) {
  const piece = await prisma.contentPiece.findUniqueOrThrow({
    where: { id: contentPieceId },
    include: { persona: true },
  });

  if (!piece.script) throw new Error("No script to generate voice from. Generate a script first.");

  const voiceConfig = piece.persona.voiceConfig as { voiceId?: string } | null;
  const voiceId = voiceConfig?.voiceId;
  if (!voiceId) {
    throw new Error("Persona has no voice configured. Go to Personas > select persona > Voice tab to design one.");
  }

  await prisma.contentPiece.update({
    where: { id: contentPieceId },
    data: { status: PipelineStatus.VOICE_GENERATING },
  });

  const job = await prisma.generationJob.create({
    data: {
      contentPieceId,
      type: JobType.VOICE,
      status: JobStatus.PROCESSING,
      startedAt: new Date(),
      inputPayload: { voiceId, text: piece.script },
    },
  });

  try {
    const audioBuffer = await elevenlabs.generateSpeech(voiceId, piece.script);
    const audioUrl = await saveAudio(Buffer.from(audioBuffer), contentPieceId);

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        outputUrl: audioUrl,
      },
    });

    await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: {
        voiceAudioUrl: audioUrl,
        generationLog: {
          ...(piece.generationLog as Record<string, unknown> || {}),
          voiceGeneratedAt: new Date().toISOString(),
          voiceJobId: job.id,
        },
      },
    });

    return { jobId: job.id, audioUrl };
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

// Step 3: Generate video via Kling
// Uses image-to-video when persona has reference images for consistency.
// Falls back to text-to-video if no reference image available.
export async function generateVideo(contentPieceId: string) {
  const piece = await prisma.contentPiece.findUniqueOrThrow({
    where: { id: contentPieceId },
    include: { persona: true },
  });

  if (!piece.script) throw new Error("No script for video generation. Generate a script first.");

  await prisma.contentPiece.update({
    where: { id: contentPieceId },
    data: { status: PipelineStatus.VIDEO_GENERATING },
  });

  const job = await prisma.generationJob.create({
    data: {
      contentPieceId,
      type: JobType.VIDEO_KLING,
      status: JobStatus.PROCESSING,
      startedAt: new Date(),
      inputPayload: {
        script: piece.script,
        appearance: piece.persona.appearance,
      },
    },
  });

  try {
    let klingJob;

    // Check if persona has reference images for image-to-video (more consistent)
    const imageUrls = piece.persona.imageUrls as string[] | null;
    const referenceImage = imageUrls?.[0];

    // Kling supports 5 or 10 second clips. For 7-second scripts, use 10s to avoid cutting off.
    const klingDuration = (piece.duration || 7) <= 5 ? 5 : 10;

    if (referenceImage) {
      // Image-to-video: use reference image for consistent appearance
      klingJob = await kling.imageToVideo({
        image_url: referenceImage,
        prompt: `${piece.persona.name} speaking to camera. ${piece.script.slice(0, 200)}`,
        duration: klingDuration,
        aspect_ratio: (piece.aspectRatio as "9:16" | "16:9" | "1:1") || "9:16",
      });
    } else {
      // Text-to-video: describe the persona
      klingJob = await kling.textToVideo({
        prompt: `${piece.persona.appearance || "A person"} speaking to camera in a well-lit room. ${piece.script.slice(0, 200)}`,
        duration: klingDuration,
        aspect_ratio: (piece.aspectRatio as "9:16" | "16:9" | "1:1") || "9:16",
      });
    }

    await prisma.generationJob.update({
      where: { id: job.id },
      data: { externalJobId: klingJob.id },
    });

    return { jobId: job.id, externalJobId: klingJob.id };
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: { status: PipelineStatus.FAILED },
    });

    throw error;
  }
}

// Step 3 (Alternative): Generate video with HeyGen (includes voice)
// HeyGen handles both avatar video + voice synthesis in one API call
export async function generateVideoWithHeyGen(contentPieceId: string) {
  const piece = await prisma.contentPiece.findUniqueOrThrow({
    where: { id: contentPieceId },
    include: { persona: true },
  });

  if (!piece.script) throw new Error("No script for video generation. Generate a script first.");

  // Check if persona has HeyGen avatar configured
  const arcadsActorId = piece.persona.arcadsActorId; // Reuse this field for HeyGen avatar ID
  if (!arcadsActorId) {
    throw new Error(
      "Persona has no HeyGen avatar configured. Go to Personas > select persona > configure avatar ID."
    );
  }

  await prisma.contentPiece.update({
    where: { id: contentPieceId },
    data: { status: PipelineStatus.VIDEO_GENERATING },
  });

  const job = await prisma.generationJob.create({
    data: {
      contentPieceId,
      type: JobType.VIDEO_HEYGEN,
      status: JobStatus.PROCESSING,
      startedAt: new Date(),
      inputPayload: {
        script: piece.script,
        avatar_id: arcadsActorId,
      },
    },
  });

  try {
    // Get voice ID if configured (optional - HeyGen will use default if not provided)
    const voiceConfig = piece.persona.voiceConfig as { voiceId?: string } | null;
    const voiceId = voiceConfig?.voiceId;

    const heygenVideo = await heygen.createVideo({
      script: piece.script,
      avatar_id: arcadsActorId,
      voice_id: voiceId,
      title: piece.title,
      test: process.env.NODE_ENV !== "production", // Use test mode in dev
    });

    await prisma.generationJob.update({
      where: { id: job.id },
      data: { externalJobId: heygenVideo.video_id },
    });

    return { jobId: job.id, externalJobId: heygenVideo.video_id };
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: { status: PipelineStatus.FAILED },
    });

    throw error;
  }
}

// Step 4: Poll video job for completion and download (supports Kling and HeyGen)
export async function pollVideoJob(jobId: string) {
  const job = await prisma.generationJob.findUniqueOrThrow({
    where: { id: jobId },
  });

  if (!job.externalJobId) throw new Error("No external job ID to poll");

  let status: string;
  let videoUrl: string | undefined;
  let error: string | undefined;

  // Check job type and use appropriate service
  if (job.type === JobType.VIDEO_HEYGEN) {
    const result = await heygen.getVideoStatus(job.externalJobId);
    status = result.status;
    videoUrl = result.video_url;
    error = result.error;
  } else if (job.type === JobType.VIDEO_KLING) {
    const result = await kling.getJobStatus(job.externalJobId);
    status = result.status;
    videoUrl = result.video_url;
    error = result.error;
  } else {
    throw new Error(`Unsupported job type for polling: ${job.type}`);
  }

  if (status === "completed" && videoUrl) {
    const localUrl = await downloadAndSave(
      videoUrl,
      `${job.contentPieceId || job.id}.mp4`,
      "video"
    );

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        outputUrl: localUrl,
      },
    });

    if (job.contentPieceId) {
      await prisma.contentPiece.update({
        where: { id: job.contentPieceId },
        data: {
          videoUrl: localUrl,
          status: PipelineStatus.READY,
        },
      });
    }
  } else if (status === "failed") {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        error: error || "Video generation failed"
      },
    });

    if (job.contentPieceId) {
      await prisma.contentPiece.update({
        where: { id: job.contentPieceId },
        data: { status: PipelineStatus.FAILED },
      });
    }
  }

  return { status, videoUrl };
}

// Step 5: Publish content
export async function publishContent(
  contentPieceId: string,
  scheduledAt?: Date
) {
  const piece = await prisma.contentPiece.findUniqueOrThrow({
    where: { id: contentPieceId },
    include: { persona: true },
  });

  if (!piece.videoUrl && piece.format === "VIDEO") {
    throw new Error("No video URL to publish. Generate a video first.");
  }

  const caption = piece.title;
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

  // Merge video + voice audio if both are local files (Kling videos have no audio)
  let finalVideoUrl = piece.videoUrl!;
  if (
    piece.voiceAudioUrl &&
    piece.videoUrl &&
    piece.videoUrl.startsWith("/uploads/") &&
    piece.voiceAudioUrl.startsWith("/uploads/")
  ) {
    const mergedPath = await mergeVideoAudio(
      piece.videoUrl,
      piece.voiceAudioUrl,
      contentPieceId
    );
    finalVideoUrl = mergedPath;

    await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: { videoUrl: mergedPath },
    });
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

      // Instagram needs a publicly accessible URL — local files won't work.
      // If the video is a local path, we need to use the original Kling CDN URL.
      // For now, require the video to already be at a public URL.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
      const videoUrl = finalVideoUrl.startsWith("http")
        ? finalVideoUrl
        : `${appUrl}${finalVideoUrl}`;

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

  return postIds;
}
