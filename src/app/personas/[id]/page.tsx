"use client";

import { use } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePersona, useUpdatePersona, useDesignVoice } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Plus, Loader2, Mic, Volume2, CheckCircle2, Circle, Image } from "lucide-react";

export default function PersonaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, refetch } = usePersona(id);
  const updatePersona = useUpdatePersona(id);
  const designVoice = useDesignVoice();

  const persona = data as {
    id: string;
    name: string;
    description: string | null;
    appearance: string | null;
    voiceConfig: { voiceId?: string; voiceName?: string; voicePrompt?: string } | null;
    arcadsActorId: string | null;
    imageUrls: string[] | null;
    status: string;
    contentPieces: { id: string; title: string; status: string; type: string }[];
    campaigns: { id: string; name: string; status: string }[];
    socialAccounts: { id: string; platform: string; username: string }[];
  } | undefined;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", appearance: "" });
  const [voicePrompt, setVoicePrompt] = useState("");

  useEffect(() => {
    if (persona) {
      setForm({
        name: persona.name,
        description: persona.description || "",
        appearance: persona.appearance || "",
      });
      setVoicePrompt(persona.voiceConfig?.voicePrompt || "");
    }
  }, [persona]);

  const handleSave = async () => {
    try {
      await updatePersona.mutateAsync(form);
      toast.success("Persona updated");
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const handleGenerateVoice = async () => {
    if (!voicePrompt.trim()) {
      toast.error("Enter a voice description first");
      return;
    }
    try {
      const result = await designVoice.mutateAsync({
        prompt: voicePrompt,
        name: `${persona?.name || "Persona"} Voice`,
      }) as { voice_id: string; name: string };

      await updatePersona.mutateAsync({
        voiceConfig: {
          voiceId: result.voice_id,
          voiceName: result.name,
          voicePrompt,
        },
      });
      toast.success("Voice created and saved!");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Voice generation failed");
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

  if (!persona) {
    return (
      <div>
        <TopBar title="Not Found" />
        <div className="p-6">
          <p className="text-muted-foreground">Persona not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title={persona.name}>
        <StatusBadge status={persona.status} />
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updatePersona.isPending}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        )}
      </TopBar>
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="content">Content ({persona.contentPieces.length})</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns ({persona.campaigns.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Setup Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Setup Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { done: !!persona.name && !!persona.description, label: "Basic Info", detail: "Name and description", tab: null },
                    { done: !!persona.appearance, label: "Appearance", detail: "Physical description for video generation", tab: null },
                    { done: !!persona.voiceConfig?.voiceId, label: "Voice Designed", detail: persona.voiceConfig?.voiceId ? `${persona.voiceConfig.voiceName}` : "Go to Voice tab to design one", tab: "voice" },
                    { done: !!(persona.imageUrls as string[] | null)?.length, label: "Reference Images", detail: (persona.imageUrls as string[] | null)?.length ? `${(persona.imageUrls as string[]).length} image(s) uploaded` : "Upload reference photos for consistent video", tab: null },
                    { done: !!persona.socialAccounts.length, label: "Instagram Connected", detail: persona.socialAccounts.length ? `@${persona.socialAccounts[0].username}` : "Go to Settings > Social Accounts", tab: null },
                    { done: persona.contentPieces.length > 0, label: "First Content Created", detail: persona.contentPieces.length ? `${persona.contentPieces.length} piece(s)` : "Create your first content piece", tab: "content" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {(() => {
                  const total = 6;
                  const done = [
                    !!persona.name && !!persona.description,
                    !!persona.appearance,
                    !!persona.voiceConfig?.voiceId,
                    !!(persona.imageUrls as string[] | null)?.length,
                    !!persona.socialAccounts.length,
                    persona.contentPieces.length > 0,
                  ].filter(Boolean).length;
                  return (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{done}/{total} complete</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editing ? (
                    <>
                      <div>
                        <Label>Name</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm">{persona.description || "No description"}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Appearance</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea value={form.appearance} onChange={(e) => setForm({ ...form, appearance: e.target.value })} rows={4} />
                  ) : (
                    <p className="text-sm line-clamp-6">{persona.appearance || "Not configured"}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Voice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {persona.voiceConfig?.voiceId ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{persona.voiceConfig.voiceName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Consistent ElevenLabs voice for all content</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No voice designed yet &mdash; go to Voice tab</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Reference Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(persona.imageUrls as string[] | null)?.length ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{(persona.imageUrls as string[]).length} image(s) uploaded</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No reference images &mdash; upload photos for consistent video generation</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Social Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  {persona.socialAccounts.length ? (
                    <div className="space-y-2">
                      {persona.socialAccounts.map((acc) => (
                        <div key={acc.id} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">@{acc.username}</span>
                          <StatusBadge status={acc.platform} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No accounts connected &mdash; go to Settings</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Design (ElevenLabs)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Design a custom voice for this persona. Once created, the same voice is used across all content for consistency.
                </p>
                <div>
                  <Label>Voice Description</Label>
                  <Textarea
                    placeholder="Describe the voice you want, e.g.: A warm, confident female voice in her mid-20s. Slightly raspy with a friendly, conversational tone. American accent. Medium pace, engaging and enthusiastic."
                    value={voicePrompt}
                    onChange={(e) => setVoicePrompt(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Be specific about age, gender, accent, tone, pace, and personality.
                  </p>
                </div>

                <Button
                  onClick={handleGenerateVoice}
                  disabled={designVoice.isPending || !voicePrompt.trim()}
                >
                  {designVoice.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4 mr-2" />
                  )}
                  {persona.voiceConfig?.voiceId ? "Redesign Voice" : "Design Voice"}
                </Button>

                {persona.voiceConfig?.voiceId && (
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-medium">Current Voice</p>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Name:</span> {persona.voiceConfig.voiceName}</p>
                      <p><span className="text-muted-foreground">Voice ID:</span> <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{persona.voiceConfig.voiceId}</code></p>
                      {persona.voiceConfig.voicePrompt && (
                        <p><span className="text-muted-foreground">Description:</span> {persona.voiceConfig.voicePrompt}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            <div className="flex justify-end mb-4">
              <Link href={`/content/new?personaId=${persona.id}`}>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Content</Button>
              </Link>
            </div>
            {!persona.contentPieces.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No content yet</p>
            ) : (
              <div className="space-y-2">
                {persona.contentPieces.map((piece) => (
                  <Link key={piece.id} href={`/content/${piece.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{piece.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={piece.type} />
                        <StatusBadge status={piece.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4">
            {!persona.campaigns.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet</p>
            ) : (
              <div className="space-y-2">
                {persona.campaigns.map((campaign) => (
                  <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-medium">{campaign.name}</span>
                      <StatusBadge status={campaign.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
