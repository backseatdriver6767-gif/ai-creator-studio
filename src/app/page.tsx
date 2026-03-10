"use client";

import { TopBar } from "@/components/layout/top-bar";
import { KPICard } from "@/components/shared/kpi-card";
import { useAnalytics } from "@/lib/hooks";
import { Users, Film, Megaphone, DollarSign, Eye, Heart, MessageSquare, Share2, ExternalLink, Upload, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

export default function DashboardPage() {
  const { data, isLoading } = useAnalytics();

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
        {/* 3-Step Workflow */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle>Create & Publish AI Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-white">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Create in HeyGen</h3>
                  <p className="text-sm text-muted-foreground mb-2">Create your AI avatar video in HeyGen&apos;s studio</p>
                  <a href={heygenLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open HeyGen
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-white">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Download Video</h3>
                  <p className="text-sm text-muted-foreground mb-2">Download the finished MP4 from HeyGen</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Download className="h-3 w-3" />
                    MP4 or MOV format
                  </div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-white">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload & Publish</h3>
                  <p className="text-sm text-muted-foreground mb-2">Upload your video and publish to all platforms</p>
                  <Link href="/content/new">
                    <Button size="sm">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload Video
                    </Button>
                  </Link>
                </div>
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

        {/* Recent Published Content */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Published Content</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics?.recentContent?.length ? (
              <p className="text-sm text-muted-foreground">No published content yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.recentContent.map((piece) => (
                  <div key={piece.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">{piece.title}</p>
                      <div className="flex gap-1 mt-1">
                        {piece.platform.map((p) => (
                          <StatusBadge key={p} status={p} />
                        ))}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {piece.publishedAt && format(new Date(piece.publishedAt), "MMM d, yyyy")}
                      <div className="flex gap-3 mt-1">
                        <span>{piece.views ?? 0} views</span>
                        <span>{piece.likes ?? 0} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
