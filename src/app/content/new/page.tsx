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
import { MediaUploader, type MediaFile } from "@/components/content/media-uploader";
import { toast } from "sonner";

export default function NewContentPage() {
  return (
    <Suspense>
      <NewContentForm />
    </Suspense>
  );
}

function NewContentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPersonaId = searchParams.get("personaId") || "";
  const createContent = useCreateContent();
  const { data: personasData } = usePersonas("ACTIVE");
  const personas = personasData as { id: string; name: string }[] | undefined;

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [form, setForm] = useState({
    personaId: preselectedPersonaId,
    title: "",
    script: "",
    type: "REEL",
    format: "VIDEO",
    platform: ["INSTAGRAM"],
    duration: 7,
    aspectRatio: "9:16",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personaId || !form.title) {
      toast.error("Persona and title are required");
      return;
    }

    try {
      // Store media file references as URLs in the content piece
      const mediaUrls = mediaFiles.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      }));

      const result = await createContent.mutateAsync({
        ...form,
        generationLog: mediaUrls.length > 0 ? { referenceMedia: mediaUrls } : undefined,
      }) as { id: string };
      toast.success("Content piece created!");
      router.push(`/content/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create content");
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Persona</Label>
                <Select value={form.personaId} onValueChange={(v) => setForm({ ...form, personaId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {personas?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title / Topic</Label>
                <Input
                  placeholder="e.g. 5 AI tools that changed my business"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Script (optional - can be AI-generated later)</Label>
                <Textarea
                  placeholder="Write or paste your script here..."
                  value={form.script}
                  onChange={(e) => setForm({ ...form, script: e.target.value })}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reference Media */}
          <MediaUploader files={mediaFiles} onChange={setMediaFiles} />

          <Card>
            <CardHeader>
              <CardTitle>Format & Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Label>Format</Label>
                  <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="CAROUSEL">Carousel</SelectItem>
                      <SelectItem value="AUDIO">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Platforms</Label>
                <div className="flex gap-2 mt-1">
                  {["INSTAGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK", "TWITTER", "LINKEDIN"].map((p) => (
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Aspect Ratio</Label>
                  <Select value={form.aspectRatio} onValueChange={(v) => setForm({ ...form, aspectRatio: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                      <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={createContent.isPending}>
              {createContent.isPending ? "Creating..." : "Create Content"}
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
