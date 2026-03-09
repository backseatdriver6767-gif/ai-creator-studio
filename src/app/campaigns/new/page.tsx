"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCampaign, usePersonas } from "@/lib/hooks";
import { toast } from "sonner";

export default function NewCampaignPage() {
  const router = useRouter();
  const createCampaign = useCreateCampaign();
  const { data: personasData } = usePersonas("ACTIVE");
  const personas = personasData as { id: string; name: string }[] | undefined;

  const [form, setForm] = useState({
    personaId: "",
    name: "",
    description: "",
    niche: "",
    productUrl: "",
    manychatKeyword: "",
    platforms: ["INSTAGRAM"],
  });

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personaId || !form.name) {
      toast.error("Persona and campaign name are required");
      return;
    }

    try {
      const result = await createCampaign.mutateAsync(form) as { id: string };
      toast.success("Campaign created!");
      router.push(`/campaigns/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create campaign");
    }
  };

  return (
    <div>
      <TopBar title="Create Campaign" />
      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Persona</Label>
                <Select value={form.personaId} onValueChange={(v) => setForm({ ...form, personaId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a persona" /></SelectTrigger>
                  <SelectContent>
                    {personas?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Campaign Name</Label>
                <Input
                  placeholder="e.g. AI Tools Launch Campaign"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Campaign objectives and strategy..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Niche</Label>
                <Input
                  placeholder="e.g. AI Tools, Beauty, Real Estate"
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monetization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Product URL</Label>
                <Input
                  placeholder="Link to what you're selling"
                  value={form.productUrl}
                  onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
                />
              </div>
              <div>
                <Label>ManyChat Keyword</Label>
                <Input
                  placeholder="e.g. AI, GUIDE, LINK"
                  value={form.manychatKeyword}
                  onChange={(e) => setForm({ ...form, manychatKeyword: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When users comment this keyword, ManyChat will auto-DM them with the product link
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {["INSTAGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK", "TWITTER", "LINKEDIN"].map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={form.platforms.includes(p) ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePlatform(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? "Creating..." : "Create Campaign"}
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
