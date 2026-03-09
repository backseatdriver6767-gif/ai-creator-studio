"use client";

import { use, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  useContentPiece,
  useGenerateScript,
  useGenerateVoice,
  useGenerateVideo,
  usePublishContent,
  useScheduleContent,
} from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  FileText,
  Mic,
  Video,
  Send,
  Loader2,
  Calendar,
  RotateCcw,
  Volume2,
  Download,
} from "lucide-react";

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useContentPiece(id);
  const generateScript = useGenerateScript(id);
  const generateVoice = useGenerateVoice(id);
  const generateVideo = useGenerateVideo(id);
  const publishContent = usePublishContent(id);
  const scheduleContent = useScheduleContent(id);

  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [videoProvider, setVideoProvider] = useState<string>("heygen");

  const piece = data as {
    id: string;
    title: string;
    script: string | null;
    voiceAudioUrl: string | null;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    type: string;
    format: string;
    platform: string[];
    duration: number | null;
    aspectRatio: string | null;
    status: string;
    generationLog: Record<string, unknown> | null;
    scheduledAt: string | null;
    publishedAt: string | null;
    views: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    persona: { id: string; name: string };
    campaign: { id: string; name: string } | null;
  } | undefined;

  const handleAction = async (action: () => Promise<unknown>, label: string) => {
    try {
      await action();
      toast.success(`${label} started`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${label} failed`);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) {
      toast.error("Please select a date and time");
      return;
    }
    try {
      await scheduleContent.mutateAsync(scheduleDate);
      toast.success("Content scheduled!");
      setShowScheduler(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scheduling failed");
    }
  };

  if (isLoading) {
    return (
      <div>
        <TopBar title="Loading..." />
        <div className="p-6 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!piece) {
    return (
      <div>
        <TopBar title="Not Found" />
        <div className="p-6"><p className="text-muted-foreground">Content not found</p></div>
      </div>
    );
  }

  const isPending = generateScript.isPending || generateVoice.isPending || generateVideo.isPending || publishContent.isPending || scheduleContent.isPending;
  const isFailed = piece.status === "FAILED";

  return (
    <div>
      <TopBar title={piece.title}>
        <StatusBadge status={piece.status} />
      </TopBar>
      <div className="p-6 space-y-6">
        {/* Pipeline: Script -> Voice -> Video -> Publish */}
        <Card>
          <CardHeader>
            <CardTitle>Content Pipeline</CardTitle>
            <p className="text-xs text-muted-foreground">
              Script (Claude) &rarr; {videoProvider === "heygen" ? "Video + Voice (HeyGen)" : "Voice (ElevenLabs) → Video (Kling)"} &rarr; Publish (Instagram)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Step 1: Script */}
              <Button
                onClick={() => handleAction(() => generateScript.mutateAsync(), "Script generation")}
                disabled={isPending}
                variant={piece.script ? "outline" : "default"}
              >
                {generateScript.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                {piece.script ? "Regenerate Script" : "1. Generate Script"}
              </Button>

              {/* Step 2: Voice (skip if using HeyGen) */}
              {videoProvider !== "heygen" && (
                <Button
                  onClick={() => handleAction(() => generateVoice.mutateAsync(), "Voice generation")}
                  disabled={isPending || !piece.script}
                  variant={piece.voiceAudioUrl ? "outline" : "default"}
                >
                  {generateVoice.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
                  {piece.voiceAudioUrl ? "Regenerate Voice" : "2. Generate Voice"}
                </Button>
              )}

              {/* Step 3: Video */}
              <div className="flex gap-2">
                <Select value={videoProvider} onValueChange={setVideoProvider}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heygen">HeyGen</SelectItem>
                    <SelectItem value="kling">Kling</SelectItem>
                    <SelectItem value="arcads">Arcads</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => handleAction(() => generateVideo.mutateAsync(videoProvider), "Video generation")}
                  disabled={isPending || !piece.script}
                  variant={piece.videoUrl ? "outline" : "default"}
                >
                  {generateVideo.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Video className="h-4 w-4 mr-2" />}
                  {piece.videoUrl ? "Regenerate Video" : "3. Generate Video"}
                </Button>
              </div>

              <Separator orientation="vertical" className="h-9" />

              {/* Step 4: Publish */}
              <Button
                onClick={() => handleAction(() => publishContent.mutateAsync(), "Publishing")}
                disabled={isPending || !piece.videoUrl}
              >
                {publishContent.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                4. Publish
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScheduler(!showScheduler)}
                disabled={isPending || !piece.videoUrl}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>

            {/* Schedule picker */}
            {showScheduler && (
              <div className="flex items-end gap-3 pt-2 border-t">
                <div className="flex-1">
                  <Label>Schedule Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <Button
                  onClick={handleSchedule}
                  disabled={scheduleContent.isPending || !scheduleDate}
                >
                  {scheduleContent.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Confirm Schedule
                </Button>
              </div>
            )}

            {/* Retry on failure */}
            {isFailed && (
              <div className="flex items-center gap-3 pt-2 border-t">
                <span className="text-sm text-red-600">Pipeline failed.</span>
                <Button variant="outline" size="sm" onClick={() => handleAction(() => generateScript.mutateAsync(), "Retry script")}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Retry Script
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAction(() => generateVoice.mutateAsync(), "Retry voice")}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Retry Voice
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAction(() => generateVideo.mutateAsync(videoProvider), "Retry video")}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Retry Video
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-2">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persona</span>
                <Link href={`/personas/${piece.persona.id}`} className="hover:underline">{piece.persona.name}</Link>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <StatusBadge status={piece.type} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format</span>
                <span>{piece.format}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platforms</span>
                <div className="flex gap-1">{piece.platform.map((p) => <StatusBadge key={p} status={p} />)}</div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{piece.duration ? `${piece.duration}s` : "N/A"}</span>
              </div>
              {piece.scheduledAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled</span>
                    <span>{new Date(piece.scheduledAt).toLocaleString()}</span>
                  </div>
                </>
              )}
              {piece.publishedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span>{new Date(piece.publishedAt).toLocaleString()}</span>
                  </div>
                </>
              )}
              {piece.campaign && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign</span>
                    <Link href={`/campaigns/${piece.campaign.id}`} className="hover:underline">{piece.campaign.name}</Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {piece.status === "PUBLISHED" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{piece.views ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{piece.likes ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{piece.comments ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{piece.shares ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Available after publishing</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Script */}
        {piece.script && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Script</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">{piece.script}</pre>
            </CardContent>
          </Card>
        )}

        {/* Audio preview */}
        {piece.voiceAudioUrl && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Voice Audio
                </CardTitle>
                <a href={piece.voiceAudioUrl} download={`${piece.title}-audio.mp3`}>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <audio controls className="w-full" src={piece.voiceAudioUrl}>
                Your browser does not support the audio element.
              </audio>
            </CardContent>
          </Card>
        )}

        {/* Video preview */}
        {piece.videoUrl && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Video Preview</CardTitle>
                <a href={piece.videoUrl} download={`${piece.title}-video.mp4`}>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <video src={piece.videoUrl} controls className="max-w-md rounded-lg" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
