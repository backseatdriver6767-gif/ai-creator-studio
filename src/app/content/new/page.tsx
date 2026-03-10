"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContent, usePersonas } from "@/lib/hooks";
import { VideoUploader } from "@/components/content/video-uploader";
import { toast } from "sonner";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

export default function NewContentPage() {
  return (
    <Suspense>
      <NewContentForm />
    </Suspense>
  );
}

function StepIndicator({ step, label, done }: { step: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? (
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
      )}
      <span className={done ? "text-green-700 font-medium" : "text-muted-foreground"}>
        Step {step}: {label}
      </span>
    </div>
  );
}

function NewContentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPersonaId = searchParams.get("personaId") || "";
  const preselectedCampaignId = searchParams.get("campaignId") || "";
  const createContent = useCreateContent();
  const { data: personasData } = usePersonas("ACTIVE");
  const personas = personasData as { id: string; name: string }[] | undefined;

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    personaId: preselectedPersonaId,
    title: "",
    caption: "",
    type: "REEL",
    format: "VIDEO",
    platform: ["INSTAGRAM"],
    campaignId: preselectedCampaignId || undefined as string | undefined,
  });

  const step1Done = !!form.personaId;
  const step2Done = !!videoFile;
  const step3Done = !!form.title;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personaId || !form.title) {
      toast.error("Persona and title are required");
      return;
    }
    if (!videoFile) {
      toast.error("Please upload a video first");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createContent.mutateAsync({
        ...form,
      }) as { id: string };

      // Upload video to the newly created content piece
      const formData = new FormData();
      formData.append("video", videoFile);
      const uploadRes = await fetch(`/api/content/${result.id}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        toast.error("Content created but video upload failed");
        router.push(`/content/${result.id}`);
        return;
      }

      toast.success("Content created! Review and publish.");
      router.push(`/content/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create content");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platform: prev.platform.includes(platform)
        ? prev.platform.filter((p) => p !== platform)
        : [...prev.platform, platform],
    }));
  };

  return (
    <div>
      <TopBar title="Create Content" />
      <div className="p-6 max-w-3xl">
        {/* Progress */}
        <div className="flex items-center gap-6 mb-6 p-4 rounded-lg bg-muted/50">
          <StepIndicator step={1} label="Select Persona" done={step1Done} />
          <StepIndicator step={2} label="Upload Video" done={step2Done} />
          <StepIndicator step={3} label="Add Details" done={step3Done} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Persona */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step1Done ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                Select Persona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={form.personaId} onValueChange={(v) => setForm({ ...form, personaId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose who's posting this content" />
                </SelectTrigger>
                <SelectContent>
                  {personas?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Step 2: Video Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step2Done ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                Upload Your HeyGen Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoUploader
                onUpload={(file) => setVideoFile(file)}
                isUploading={false}
                isCompleted={!!videoFile}
              />
            </CardContent>
          </Card>

          {/* Step 3: Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step3Done ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                Content Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title / Topic</Label>
                <Input
                  placeholder="e.g. 5 AI tools that changed my business"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Instagram Caption & Hashtags</Label>
                <Textarea
                  placeholder={"Write your Instagram caption here...\n\nInclude hashtags at the end:\n#AI #ContentCreator #HeyGen"}
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is what appears below your post on Instagram. Add your CTA and hashtags here.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Content Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REEL">Reel</SelectItem>
                      <SelectItem value="STORY">Story</SelectItem>
                      <SelectItem value="POST">Post</SelectItem>
                      <SelectItem value="PODCAST">Podcast</SelectItem>
                      <SelectItem value="AD">Ad</SelectItem>
                      <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Platforms</Label>
                  <div className="flex gap-2 mt-1">
                    {["INSTAGRAM", "TIKTOK", "YOUTUBE"].map((p) => (
                      <Button
                        key={p}
                        type="button"
                        variant={form.platform.includes(p) ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePlatform(p)}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={submitting || !form.personaId || !form.title || !videoFile}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Continue to Review & Publish"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
