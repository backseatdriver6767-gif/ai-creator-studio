"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePersona, useSocialAccounts } from "@/lib/hooks";
import { Instagram, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function NewPersonaPage() {
  const router = useRouter();
  const createPersona = useCreatePersona();
  const { data: socialAccountsData } = useSocialAccounts();

  const socialAccounts = socialAccountsData as {
    id: string;
    platform: string;
    username: string;
    persona: { id: string; name: string } | null;
  }[] | undefined;

  const [form, setForm] = useState({
    name: "",
    description: "",
    socialAccountIds: [] as string[],
  });

  const heygenLink = process.env.NEXT_PUBLIC_HEYGEN_AFFILIATE_LINK || "https://app.heygen.com";

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
        status: "ACTIVE",
      }) as { id: string };

      // Link selected social accounts to the new persona
      if (form.socialAccountIds.length > 0) {
        await Promise.all(
          form.socialAccountIds.map((accountId) =>
            fetch(`/api/social-accounts/${accountId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ personaId: result.id }),
            })
          )
        );
      }

      toast.success("Persona created!");
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
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Connect Social Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!socialAccounts || socialAccounts.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>No accounts connected yet.</strong> Go to Settings to connect Instagram, TikTok, or YouTube.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Select which social accounts this persona will post to
                  </p>
                  <div className="space-y-3">
                    {socialAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`account-${account.id}`}
                          checked={form.socialAccountIds.includes(account.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setForm({
                                ...form,
                                socialAccountIds: [...form.socialAccountIds, account.id],
                              });
                            } else {
                              setForm({
                                ...form,
                                socialAccountIds: form.socialAccountIds.filter((id) => id !== account.id),
                              });
                            }
                          }}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`account-${account.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            @{account.username}
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 capitalize">
                              {account.platform}
                            </span>
                            {account.persona && (
                              <span className="text-xs text-muted-foreground">
                                Currently used by: {account.persona.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                After creating your persona, follow these steps to publish content:
              </p>
              <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                <li><strong className="text-foreground">Create a video in HeyGen</strong> using your avatar and script</li>
                <li><strong className="text-foreground">Download the MP4</strong> from HeyGen when it&apos;s ready</li>
                <li><strong className="text-foreground">Upload & publish</strong> from the Content page</li>
              </ol>
              <a href={heygenLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open HeyGen
                </Button>
              </a>
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
