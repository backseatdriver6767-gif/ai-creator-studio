"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePersona } from "@/lib/hooks";
import { ImageAnalyzer } from "@/components/personas/image-analyzer";
import { toast } from "sonner";

export default function NewPersonaPage() {
  const router = useRouter();
  const createPersona = useCreatePersona();

  const [form, setForm] = useState({
    name: "",
    description: "",
    appearance: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Name is required");
      return;
    }

    try {
      const result = await createPersona.mutateAsync({
        name: form.name,
        description: form.description,
        appearance: form.appearance,
        status: "ACTIVE",
      }) as { id: string };
      toast.success("Persona created! Now design a voice on the Voice tab.");
      router.push(`/personas/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create persona");
    }
  };

  return (
    <div>
      <TopBar title="Create New Persona" />
      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Persona Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sophia Blake"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description / Bio</Label>
                <Textarea
                  id="description"
                  placeholder="A brief character bio for this AI persona..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appearance">Physical Description</Label>
                  <Textarea
                    id="appearance"
                    placeholder="Detailed physical description for image generation prompts. e.g. 'Young woman, early 20s, dirty blonde hair, blue eyes, athletic build...'"
                    value={form.appearance}
                    onChange={(e) => setForm({ ...form, appearance: e.target.value })}
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Write manually or use the image analyzer to auto-generate from a reference photo
                  </p>
                </div>
                <div>
                  <ImageAnalyzer
                    onDescriptionGenerated={(desc) =>
                      setForm({ ...form, appearance: desc })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                After creating this persona, you&apos;ll configure two things on the detail page:
              </p>
              <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                <li><strong>Voice</strong> &mdash; Design a custom ElevenLabs voice for consistent narration across all content</li>
                <li><strong>Reference Images</strong> &mdash; Upload reference photos so Kling can generate consistent video appearances</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={createPersona.isPending}>
              {createPersona.isPending ? "Creating..." : "Create Persona"}
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
