"use client";

import { use } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePersona, useUpdatePersona } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Plus, CheckCircle2, Circle } from "lucide-react";

export default function PersonaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = usePersona(id);
  const updatePersona = useUpdatePersona(id);

  const persona = data as {
    id: string;
    name: string;
    description: string | null;
    status: string;
    contentPieces: { id: string; title: string; status: string; type: string }[];
    campaigns: { id: string; name: string; status: string }[];
    socialAccounts: { id: string; platform: string; username: string }[];
  } | undefined;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (persona) {
      setForm({
        name: persona.name,
        description: persona.description || "",
      });
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
                    { done: !!persona.name && !!persona.description, label: "Basic Info", detail: "Name and description" },
                    { done: !!persona.socialAccounts.length, label: "Social Accounts", detail: persona.socialAccounts.length ? `@${persona.socialAccounts[0].username}` : "Connect Instagram, TikTok, or YouTube" },
                    { done: persona.contentPieces.length > 0, label: "First Content", detail: persona.contentPieces.length ? `${persona.contentPieces.length} piece(s) created` : "Upload your first video" },
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
                  const total = 3;
                  const done = [
                    !!persona.name && !!persona.description,
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
