"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCampaign, usePersonas } from "@/lib/hooks";
import { toast } from "sonner";
import { Megaphone, Plus } from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const createCampaign = useCreateCampaign();
  const { data: personasData } = usePersonas("ACTIVE");
  const personas = personasData as { id: string; name: string }[] | undefined;

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [form, setForm] = useState({
    personaId: "",
    personaName: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Campaign name is required");
      return;
    }
    if (mode === "existing" && !form.personaId) {
      toast.error("Select a persona or create a new one");
      return;
    }
    if (mode === "new" && !form.personaName) {
      toast.error("Enter a persona name");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        platforms: ["INSTAGRAM"],
      };
      if (mode === "existing") {
        payload.personaId = form.personaId;
      } else {
        payload.personaName = form.personaName;
      }

      const result = (await createCampaign.mutateAsync(payload)) as { id: string };
      toast.success("Campaign created!");
      router.push(`/campaigns/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create campaign");
    }
  };

  return (
    <div>
      <TopBar title="Create Campaign" />
      <div className="p-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                New Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  placeholder="e.g. AI Tools Launch"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <Label>Persona</Label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={mode === "existing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("existing")}
                  >
                    Select Existing
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "new" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("new")}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create New
                  </Button>
                </div>

                {mode === "existing" ? (
                  <Select
                    value={form.personaId}
                    onValueChange={(v) => setForm({ ...form, personaId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {personas?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="e.g. Sophia Blake"
                    value={form.personaName}
                    onChange={(e) => setForm({ ...form, personaName: e.target.value })}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createCampaign.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              {createCampaign.isPending ? "Creating..." : "Create & Open Builder"}
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
