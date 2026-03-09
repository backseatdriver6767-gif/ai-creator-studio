"use client";

import { TopBar } from "@/components/layout/top-bar";
import { KPICard } from "@/components/shared/kpi-card";
import { useAnalytics, useOrders } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Eye, Heart, MessageSquare, Share2, DollarSign, ShoppingBag } from "lucide-react";
import { format } from "date-fns";

export default function AnalyticsPage() {
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  const { data: ordersData, isLoading: ordersLoading } = useOrders({ status: "COMPLETED" });

  const analytics = analyticsData as {
    engagement: { views: number; likes: number; comments: number; shares: number };
    revenue: { total: number; orders: number };
    content: { total: number; published: number };
    recentContent: { id: string; title: string; views: number | null; likes: number | null; comments: number | null; shares: number | null; platform: string[]; publishedAt: string | null }[];
  } | undefined;

  const orders = ordersData as {
    id: string;
    amount: number;
    currency: string;
    customerEmail: string | null;
    source: string | null;
    createdAt: string;
    product: { id: string; name: string };
  }[] | undefined;

  if (analyticsLoading) {
    return (
      <div>
        <TopBar title="Analytics" />
        <div className="p-6 grid gap-4 grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 grid-cols-4">
          <KPICard title="Total Views" value={analytics?.engagement.views ?? 0} icon={Eye} />
          <KPICard title="Total Likes" value={analytics?.engagement.likes ?? 0} icon={Heart} />
          <KPICard title="Total Comments" value={analytics?.engagement.comments ?? 0} icon={MessageSquare} />
          <KPICard title="Total Shares" value={analytics?.engagement.shares ?? 0} icon={Share2} />
        </div>

        <div className="grid gap-4 grid-cols-2">
          <KPICard
            title="Revenue"
            value={`$${(analytics?.revenue.total ?? 0).toFixed(2)}`}
            description={`${analytics?.revenue.orders ?? 0} total orders`}
            icon={DollarSign}
          />
          <KPICard
            title="Content Published"
            value={analytics?.content.published ?? 0}
            description={`${analytics?.content.total ?? 0} total pieces`}
            icon={ShoppingBag}
          />
        </div>

        <div className="grid gap-4 grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Content</CardTitle>
            </CardHeader>
            <CardContent>
              {!analytics?.recentContent?.length ? (
                <p className="text-sm text-muted-foreground">No published content yet</p>
              ) : (
                <div className="space-y-3">
                  {analytics.recentContent.map((piece) => (
                    <div key={piece.id} className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-48">{piece.title}</span>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{piece.views ?? 0} views</span>
                        <span>{piece.likes ?? 0} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <Skeleton className="h-32" />
              ) : !orders?.length ? (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 10).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-xs">{order.product.name}</TableCell>
                        <TableCell className="text-xs font-medium">
                          ${(order.amount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), "MMM d")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
