"use client";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { useSocialAccounts } from "@/lib/hooks";
import { RefreshCw, CheckCircle, XCircle, ExternalLink, Loader2, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const { data: accountsData, refetch: refetchAccounts, isRefetching } = useSocialAccounts();
  const [syncing, setSyncing] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const accounts = accountsData as {
    id: string;
    platform: string;
    username: string;
    lateAccountId: string | null;
    persona: { id: string; name: string };
  }[] | undefined;

  const heygenLink = process.env.NEXT_PUBLIC_HEYGEN_AFFILIATE_LINK || "https://app.heygen.com";

  const apiKeyCategories = [
    {
      category: "Social Media Distribution",
      description: "Post your content to social platforms",
      keys: [
        { id: "meta", envVar: "META_APP_ID", label: "Meta (Instagram)", description: "Direct Instagram posting via Graph API", signupUrl: "https://developers.facebook.com" },
        { id: "late", envVar: "LATE_API_KEY", label: "Late.dev", description: "TikTok & YouTube posting (optional)", signupUrl: "https://getlate.dev" },
      ]
    },
    {
      category: "Monetization & Automation",
      description: "Collect payments and automate customer interactions",
      keys: [
        { id: "stripe", envVar: "STRIPE_SECRET_KEY", label: "Stripe", description: "Payment processing for your products", signupUrl: "https://dashboard.stripe.com", required: true },
        { id: "manychat", envVar: "MANYCHAT_API_TOKEN", label: "ManyChat", description: "Comment-to-DM automation (optional)", signupUrl: "https://manychat.com" },
      ]
    },
  ];

  const handleSyncLate = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/social-accounts?sync=true");
      if (!res.ok) throw new Error("Sync failed");
      await refetchAccounts();
      toast.success("Synced accounts from Late.dev");
    } catch {
      toast.error("Failed to sync - check your Late.dev API key");
    } finally {
      setSyncing(false);
    }
  };

  const handleResetOnboarding = async () => {
    setResettingOnboarding(true);
    try {
      const res = await fetch("/api/settings/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
      if (!res.ok) throw new Error("Failed to reset onboarding");
      toast.success("Onboarding reset successfully. Reloading...");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Failed to reset onboarding");
      setResettingOnboarding(false);
    }
  };

  return (
    <div>
      <TopBar title="Settings" />
      <div className="p-6 max-w-3xl">
        {/* Quick Actions */}
        <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Need to reconfigure your setup?</h3>
                <p className="text-sm text-muted-foreground">
                  Run the onboarding wizard again to review social accounts and payment setup
                </p>
              </div>
              <Button
                onClick={handleResetOnboarding}
                disabled={resettingOnboarding}
                className="ml-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {resettingOnboarding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Restarting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Wizard
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="apis">
          <TabsList>
            <TabsTrigger value="apis">API Keys</TabsTrigger>
            <TabsTrigger value="heygen">HeyGen</TabsTrigger>
            <TabsTrigger value="social">Social Accounts</TabsTrigger>
            <TabsTrigger value="manychat">ManyChat</TabsTrigger>
            <TabsTrigger value="app">Application</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="apis" className="space-y-6 mt-4">
            {apiKeyCategories.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle>{category.category}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.keys.map((key, index) => (
                    <div key={key.id}>
                      {index > 0 && <Separator className="mb-3" />}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{key.label}</p>
                            {'required' in key && key.required && (
                              <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{key.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Env: <code className="bg-muted px-1 py-0.5 rounded">{key.envVar}</code>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <a href={key.signupUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* HeyGen Tab */}
          <TabsContent value="heygen" className="space-y-6 mt-4">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle>HeyGen Video Creation</CardTitle>
                <CardDescription>
                  Create your AI avatar videos directly in HeyGen, then upload them here to publish.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm font-semibold mb-2">How it works:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Create videos in HeyGen&apos;s studio with your avatar</li>
                    <li>Download the finished MP4</li>
                    <li>Upload here and publish to all platforms</li>
                  </ol>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    No API key needed. You create videos directly in HeyGen&apos;s app and upload the MP4 here.
                  </p>
                </div>
                <a href={heygenLink} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open HeyGen
                  </Button>
                </a>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Accounts Tab */}
          <TabsContent value="social" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Instagram (Direct API)</CardTitle>
                <CardDescription>
                  Connect your Instagram Business account directly via Meta Graph API.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <a href="/api/auth/instagram">
                  <Button>Connect Instagram Account</Button>
                </a>
                <div className="text-sm space-y-2">
                  <p className="font-medium">Prerequisites:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Instagram account must be a <strong>Business</strong> or <strong>Creator</strong> account</li>
                    <li>Instagram must be linked to a <strong>Facebook Page</strong></li>
                    <li>Set <code className="bg-muted px-1 py-0.5 rounded">META_APP_ID</code> and <code className="bg-muted px-1 py-0.5 rounded">META_APP_SECRET</code> in your .env file</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Connected Accounts</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchAccounts()}
                    disabled={isRefetching}
                  >
                    {isRefetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!accounts?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No social accounts connected yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {accounts.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={acc.platform} />
                          <div>
                            <p className="text-sm font-medium">@{acc.username}</p>
                            <p className="text-xs text-muted-foreground">
                              Persona: {acc.persona.name}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Connected
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Platforms (Optional)</CardTitle>
                <CardDescription>
                  Use Late.dev for TikTok, YouTube, and other platforms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncLate}
                  disabled={syncing}
                >
                  {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Sync from Late.dev
                </Button>
                <p className="text-xs text-muted-foreground">
                  Set <code className="bg-muted px-1 py-0.5 rounded">LATE_API_KEY</code> in .env first.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ManyChat Tab */}
          <TabsContent value="manychat" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>ManyChat Setup</CardTitle>
                <CardDescription>
                  Configure ManyChat for comment-to-DM automation on Instagram.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <p className="font-medium">How ManyChat comment-to-DM works:</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>You post a reel with a CTA like &quot;Comment &apos;AI&apos; to get the free guide&quot;</li>
                    <li>ManyChat detects the keyword in comments on your Instagram post</li>
                    <li>ManyChat auto-sends a DM with your checkout link</li>
                    <li>Customer clicks link, buys product via Stripe</li>
                  </ol>
                </div>

                <Separator />

                <div>
                  <Label>ManyChat API Token</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="password"
                      placeholder="Set via MANYCHAT_API_TOKEN in .env"
                      disabled
                      className="flex-1"
                    />
                    <a href="https://app.manychat.com/settings/api" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Get Token
                      </Button>
                    </a>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Setup Steps:</p>
                  <div className="space-y-2">
                    {[
                      "Sign up for ManyChat Pro ($15/mo) and connect your Instagram Business account",
                      "Create an Automation flow with a \"Keyword\" trigger",
                      "Set the keyword (e.g. \"AI\", \"LINK\", \"FREE\") to match what you say in your reels",
                      "Add a \"Send Message\" action with your Stripe checkout link",
                      "Set the keyword in your Campaign settings to track which campaigns use which triggers",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="bg-muted rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Application Tab */}
          <TabsContent value="app" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>App URL</Label>
                  <Input
                    value={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set via NEXT_PUBLIC_APP_URL environment variable
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Onboarding Wizard</CardTitle>
                <CardDescription>
                  Re-run the onboarding wizard to review setup steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleResetOnboarding}
                  disabled={resettingOnboarding}
                  className="w-full sm:w-auto"
                >
                  {resettingOnboarding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Run Onboarding Again
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
