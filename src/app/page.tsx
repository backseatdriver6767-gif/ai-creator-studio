"use client";

import { TopBar } from "@/components/layout/top-bar";
import { KPICard } from "@/components/shared/kpi-card";
import { useAnalytics, useUsage } from "@/lib/hooks";
import { Users, Film, Megaphone, DollarSign, Eye, Heart, MessageSquare, Share2, CheckCircle, XCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data, isLoading } = useAnalytics();
  const { data: usageData } = useUsage();

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

  const usage = usageData as {
    services: { service: string; total: number; completed: number; failed: number; processing: number }[];
    recentJobs: { id: string; type: string; status: string; createdAt: string; completedAt: string | null; error: string | null }[];
    apiStatus: Record<string, { configured: boolean; name: string }>;
  } | undefined;

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
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

        <div className="grid gap-4 grid-cols-2">
          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                API Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usage?.apiStatus ? (
                <div className="space-y-2">
                  {Object.entries(usage.apiStatus).map(([key, api]) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm">{api.name}</span>
                      {api.configured ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 gap-1">
                          <XCircle className="h-3 w-3" />
                          Not configured
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}
            </CardContent>
          </Card>

          {/* API Usage by Service */}
          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {!usage?.services?.length ? (
                <p className="text-sm text-muted-foreground">No API calls yet. Generate content to see usage.</p>
              ) : (
                <div className="space-y-3">
                  {usage.services.map((svc) => (
                    <div key={svc.service} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{svc.service}</span>
                        <span className="text-muted-foreground">{svc.total} calls</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">{svc.completed} completed</span>
                        {svc.processing > 0 && (
                          <span className="text-purple-600">{svc.processing} in progress</span>
                        )}
                        {svc.failed > 0 && (
                          <span className="text-red-600">{svc.failed} failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        {usage?.recentJobs && usage.recentJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Generation Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {usage.recentJobs.slice(0, 10).map((job) => (
                  <div key={job.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={job.type} />
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {format(new Date(job.createdAt), "MMM d, h:mm a")}
                      {job.error && (
                        <p className="text-red-500 mt-0.5 max-w-48 truncate">{job.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
