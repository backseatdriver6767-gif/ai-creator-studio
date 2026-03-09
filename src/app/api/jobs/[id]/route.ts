import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { pollVideoJob } from "@/lib/engines/content-pipeline";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.generationJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If the job is still processing, try to poll for updates
  if (job.status === "PROCESSING" && job.externalJobId) {
    try {
      const update = await pollVideoJob(id);
      return NextResponse.json({ ...job, ...update });
    } catch {
      // Return current status if polling fails
    }
  }

  return NextResponse.json(job);
}
