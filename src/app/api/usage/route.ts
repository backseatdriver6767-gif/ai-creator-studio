import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  // Get generation job counts and status by service
  const jobs = await prisma.generationJob.groupBy({
    by: ["type", "status"],
    _count: true,
  });

  // Build per-service usage summary
  const serviceMap: Record<
    string,
    { service: string; total: number; completed: number; failed: number; processing: number }
  > = {};

  const serviceNames: Record<string, string> = {
    VOICE: "ElevenLabs",
    VIDEO_ARCADS: "Arcads AI",
    VIDEO_KLING: "Kling AI",
    VIDEO_SORA: "Sora (OpenAI)",
    VIDEO_HEYGEN: "HeyGen",
    IMAGE_NANOBANNA: "Nano Banana (Gemini)",
    COMPOSITE: "Compositing",
  };

  for (const job of jobs) {
    const key = job.type;
    if (!serviceMap[key]) {
      serviceMap[key] = {
        service: serviceNames[key] || key,
        total: 0,
        completed: 0,
        failed: 0,
        processing: 0,
      };
    }
    serviceMap[key].total += job._count;
    if (job.status === "COMPLETED") serviceMap[key].completed += job._count;
    if (job.status === "FAILED") serviceMap[key].failed += job._count;
    if (job.status === "PROCESSING" || job.status === "QUEUED")
      serviceMap[key].processing += job._count;
  }

  // Get recent jobs
  const recentJobs = await prisma.generationJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      completedAt: true,
      error: true,
    },
  });

  // API key status check
  const apiStatus = {
    anthropic: { configured: !!process.env.ANTHROPIC_API_KEY, name: "Anthropic (Claude)" },
    openai: { configured: !!process.env.OPENAI_API_KEY, name: "OpenAI (GPT-4o)" },
    elevenlabs: { configured: !!process.env.ELEVENLABS_API_KEY, name: "ElevenLabs" },
    heygen: { configured: !!process.env.HEYGEN_API_KEY, name: "HeyGen" },
    kling: { configured: !!process.env.KLING_ACCESS_KEY && !!process.env.KLING_SECRET_KEY, name: "Kling AI" },
    google: { configured: !!process.env.GOOGLE_AI_API_KEY, name: "Google AI (Gemini)" },
    meta: {
      configured: !!process.env.META_APP_ID && !!process.env.META_APP_SECRET,
      name: "Meta (Instagram)",
    },
    arcads: {
      configured: !!process.env.ARCADS_CLIENT_ID && !!process.env.ARCADS_CLIENT_SECRET,
      name: "Arcads AI",
    },
    late: { configured: !!process.env.LATE_API_KEY, name: "Late.dev" },
    manychat: { configured: !!process.env.MANYCHAT_API_TOKEN, name: "ManyChat" },
    stripe: { configured: !!process.env.STRIPE_SECRET_KEY, name: "Stripe" },
  };

  return NextResponse.json({
    services: Object.values(serviceMap),
    recentJobs,
    apiStatus,
  });
}
