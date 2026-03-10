"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useCampaigns } from "@/lib/hooks";
import { Plus, Megaphone, Film, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  niche: string | null;
  status: string;
  platforms: string[];
  persona: { id: string; name: string };
  products: { id: string; name: string; price: number; checkoutUrl: string | null }[];
  _count: { contentPieces: number; products: number };
};

export default function CampaignsPage() {
  const { data, isLoading } = useCampaigns();
  const campaigns = data as Campaign[] | undefined;
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered =
    statusFilter === "ALL"
      ? campaigns
      : campaigns?.filter((c) => c.status === statusFilter);

  return (
    <div>
      <TopBar title="Campaigns">
        <Link href="/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        </Link>
      </TopBar>
      <div className="p-6 space-y-4">
        {/* Status filter */}
        <div className="flex gap-2">
          {["ALL", "DRAFT", "ACTIVE", "PAUSED", "COMPLETED"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : !filtered?.length ? (
          <EmptyState
            icon={Megaphone}
            title={statusFilter === "ALL" ? "No campaigns yet" : `No ${statusFilter.toLowerCase()} campaigns`}
            description="Create a campaign to organize your content strategy"
            action={
              <Link href="/campaigns/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Create Campaign
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-2">
            {filtered.map((campaign) => (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <StatusBadge status={campaign.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {campaign.persona.name}
                    </p>
                    {campaign.niche && (
                      <p className="text-xs text-muted-foreground">
                        Niche: {campaign.niche}
                      </p>
                    )}
                    <div className="flex gap-1">
                      {campaign.platforms.map((p) => (
                        <StatusBadge key={p} status={p} />
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Film className="h-3 w-3" />
                        {campaign._count.contentPieces} content
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {campaign._count.products} products
                      </span>
                    </div>
                    {campaign.products[0]?.checkoutUrl && (
                      <p className="text-xs text-green-600 truncate">
                        Payment link active
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
