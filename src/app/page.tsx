"use client";

import { TopBar } from "@/components/layout/top-bar";
import { KPICard } from "@/components/shared/kpi-card";
import { useAnalytics, useCampaigns } from "@/lib/hooks";
import { Users, Film, Megaphone, DollarSign, Eye, Heart, MessageSquare, Share2, ExternalLink, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { data, isLoading } = useAnalytics();
  const { data: campaignsData } = useCampaigns();

  const campaigns = campaignsData as {
    id: string;
    name: string;
    status: string;
    platforms: string[];
    persona: { id: string; name: string };
    _count: { contentPieces: number; products: number };
  }[] | undefined;

  if (isLoading) {
    return (
      <div>
        <TopBar title="Dashboard" />
        <div className="p-6 grid gap-4 grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const analytics = data as {
    personas: { total: number; active: number };
    content: { total: number; published: number };
    campaigns: { total: number };
    revenue: { total: number; orders: number };
    engagement: { views: number; likes: number; comments: number; shares: number };
    recentContent: { id: string; title: string; views: number | null; likes: number | null; comments: number | null; shares: number | null; platform: string[]; publishedAt: string | null }[];
  } | undefined;

  const heygenLink = process.env.NEXT_PUBLIC_HEYGEN_AFFILIATE_LINK || "https://app.heygen.com";

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Campaign CTA */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Create & Monetize AI Content</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Build a campaign: create your persona, upload your HeyGen video, add a product, and publish.
                </p>
                <div className="flex gap-3">
                  <Link href="/campaigns/new">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Campaign
                    </Button>
                  </Link>
                  <a href={heygenLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open HeyGen
                    </Button>
                  </a>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-5xl">
                <Megaphone className="h-16 w-16 text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid gap-4 grid-cols-4">
          <KPICard
            title="Active Personas"
            value={analytics?.personas.active ?? 0}
            description={`${analytics?.personas.total ?? 0} total`}
            icon={Users}
          />
          <KPICard
            title="Content Pieces"
            value={analytics?.content.total ?? 0}
            description={`${analytics?.content.published ?? 0} published`}
            icon={Film}
          />
          <KPICard
            title="Active Campaigns"
            value={analytics?.campaigns.total ?? 0}
            icon={Megaphone}
          />
          <KPICard
            title="Revenue"
            value={`$${(analytics?.revenue.total ?? 0).toFixed(2)}`}
            description={`${analytics?.revenue.orders ?? 0} orders`}
            icon={DollarSign}
          />
        </div>

        <div className="grid gap-4 grid-cols-4">
          <KPICard title="Total Views" value={analytics?.engagement.views ?? 0} icon={Eye} />
          <KPICard title="Total Likes" value={analytics?.engagement.likes ?? 0} icon={Heart} />
          <KPICard title="Total Comments" value={analytics?.engagement.comments ?? 0} icon={MessageSquare} />
          <KPICard title="Total Shares" value={analytics?.engagement.shares ?? 0} icon={Share2} />
        </div>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Campaigns</CardTitle>
              <Link href="/campaigns">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!campaigns?.length ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No campaigns yet</p>
                <Link href="/campaigns/new">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.slice(0, 5).map((campaign) => (
                  <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.persona.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {campaign.platforms.map((p) => (
                            <StatusBadge key={p} status={p} />
                          ))}
                        </div>
                        <StatusBadge status={campaign.status} />
                        <div className="text-xs text-muted-foreground">
                          {campaign._count.contentPieces} content
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
