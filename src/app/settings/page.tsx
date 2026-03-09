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
import { useUsage, useSocialAccounts } from "@/lib/hooks";
import { RefreshCw, CheckCircle, XCircle, ExternalLink, Loader2, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const { data: usageData } = useUsage();
  const { data: accountsData, refetch: refetchAccounts, isRefetching } = useSocialAccounts();
  const [syncing, setSyncing] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const usage = usageData as {
    apiStatus: Record<string, { configured: boolean; name: string }>;
  } | undefined;

  const accounts = accountsData as {
    id: string;
    platform: string;
    username: string;
    lateAccountId: string | null;
    persona: { id: string; name: string };
  }[] | undefined;

  const apiKeyCategories = [
    {
      category: "Core AI Services",
      description: "Required for content creation",
      keys: [
        { id: "anthropic", envVar: "ANTHROPIC_API_KEY", label: "Anthropic (Claude)", description: "Script writing and content ideation", signupUrl: "https://console.anthropic.com", required: true },
        { id: "openai", envVar: "OPENAI_API_KEY", label: "OpenAI (GPT-4o)", description: "Image analysis and descriptions", signupUrl: "https://platform.openai.com", required: true },
      ]
    },
    {
      category: "Video Generation - Choose Your Tier",
      description: "Pick one tier based on quality needs and budget",
      keys: [
        { id: "arcads", envVar: "ARCADS_CLIENT_ID", label: "Arcads AI", description: "👑 Premium: Highest quality AI avatars (all-in-one)", signupUrl: "https://www.arcads.ai", tier: "premium" },
        { id: "heygen", envVar: "HEYGEN_API_KEY", label: "HeyGen", description: "🎭 Standard: Great quality with ElevenLabs built-in", signupUrl: "https://heygen.com", tier: "standard" },
        { id: "kling", envVar: "KLING_API_KEY", label: "Kling AI", description: "💚 Budget: Cinematic video (use with ElevenLabs)", signupUrl: "https://klingai.com", tier: "budget" },
        { id: "elevenlabs", envVar: "ELEVENLABS_API_KEY", label: "ElevenLabs", description: "🎙️ Voice generation (needed for Budget tier)", signupUrl: "https://elevenlabs.io", tier: "budget" },
      ]
    },
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
                  Run the onboarding wizard again to review AI services, social accounts, and payment setup
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
                  {category.keys.map((key, index) => {
                    const status = usage?.apiStatus?.[key.id];
                    const isConfigured = status?.configured ?? false;

                    return (
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
                              {'tier' in key && key.tier === 'premium' && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs border-0">
                                  Premium
                                </Badge>
                              )}
                              {'tier' in key && key.tier === 'standard' && (
                                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs border-0">
                                  Standard
                                </Badge>
                              )}
                              {'tier' in key && key.tier === 'budget' && (
                                <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs border-0">
                                  Budget
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{key.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Env: <code className="bg-muted px-1 py-0.5 rounded">{key.envVar}</code>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {isConfigured ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-500 gap-1">
                                <XCircle className="h-3 w-3" />
                                Not set
                              </Badge>
                            )}
                            <a href={key.signupUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Social Accounts Tab */}
          <TabsContent value="social" className="space-y-6 mt-4">
            {/* Instagram Direct Connection */}
            <Card>
              <CardHeader>
                <CardTitle>Instagram (Direct API)</CardTitle>
                <CardDescription>
                  Connect your Instagram Business account directly via Meta Graph API. No third-party service needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <a href="/api/auth/instagram">
                  <Button>
                    Connect Instagram Account
                  </Button>
                </a>
                <div className="text-sm space-y-2">
                  <p className="font-medium">Prerequisites:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Instagram account must be a <strong>Business</strong> or <strong>Creator</strong> account</li>
                    <li>Instagram must be linked to a <strong>Facebook Page</strong></li>
                    <li>Set <code className="bg-muted px-1 py-0.5 rounded">META_APP_ID</code> and <code className="bg-muted px-1 py-0.5 rounded">META_APP_SECRET</code> in your .env file</li>
                    <li>Your Meta App must have <code className="bg-muted px-1 py-0.5 rounded">instagram_content_publish</code> permission approved</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
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
                    No social accounts connected yet. Click &quot;Connect Instagram Account&quot; above to get started.
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

            {/* Late.dev (optional for other platforms) */}
            <Card>
              <CardHeader>
                <CardTitle>Other Platforms (Optional)</CardTitle>
                <CardDescription>
                  Use Late.dev for TikTok, YouTube, and other platforms. Not needed for Instagram.
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
                  Only needed if you want to post to TikTok/YouTube via API.
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
                    <a href="https://manychat.com/app/settings/api" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Get Token
                      </Button>
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your token from ManyChat Settings &gt; API
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Setup Steps:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="bg-muted rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                      <p className="text-muted-foreground">
                        <a href="https://manychat.com" target="_blank" rel="noopener noreferrer" className="underline">Sign up for ManyChat Pro</a> ($15/mo) and connect your Instagram Business account
                      </p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="bg-muted rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                      <p className="text-muted-foreground">Create an Automation flow with a &quot;Keyword&quot; trigger</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="bg-muted rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                      <p className="text-muted-foreground">Set the keyword (e.g. &quot;AI&quot;, &quot;LINK&quot;, &quot;FREE&quot;) to match what you say in your reels</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="bg-muted rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                      <p className="text-muted-foreground">Add a &quot;Send Message&quot; action with your Stripe checkout link</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="bg-muted rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">5</span>
                      <p className="text-muted-foreground">Set the keyword in your Campaign settings to track which campaigns use which triggers</p>
                    </div>
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
                    value={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}
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
                  Re-run the onboarding wizard to review setup steps or reconfigure your services
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
                <p className="text-xs text-muted-foreground mt-2">
                  This will reset your onboarding status and show the welcome wizard on next page load
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>n8n Automation</CardTitle>
                <CardDescription>
                  Connect to your self-hosted n8n instance for automated content workflows (optional, for later)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>n8n URL</Label>
                  <Input placeholder="http://192.168.1.210:5678" disabled />
                  <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
