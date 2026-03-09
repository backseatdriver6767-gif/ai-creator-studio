"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useCampaigns } from "@/lib/hooks";
import { Plus, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsPage() {
  const { data, isLoading } = useCampaigns();
  const campaigns = data as {
    id: string;
    name: string;
    description: string | null;
    niche: string | null;
    status: string;
    platforms: string[];
    persona: { id: string; name: string };
    _count: { contentPieces: number; products: number };
  }[] | undefined;

  return (
    <div>
      <TopBar title="Campaigns">
        <Link href="/campaigns/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
        </Link>
      </TopBar>
      <div className="p-6">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : !campaigns?.length ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Create a campaign to organize your content strategy"
            action={
              <Link href="/campaigns/new">
                <Button><Plus className="h-4 w-4 mr-2" /> Create Campaign</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-2">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <StatusBadge status={campaign.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{campaign.persona.name}</p>
                    {campaign.niche && (
                      <p className="text-xs text-muted-foreground mb-2">Niche: {campaign.niche}</p>
                    )}
                    <div className="flex gap-1 mb-2">
                      {campaign.platforms.map((p) => (
                        <StatusBadge key={p} status={p} />
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{campaign._count.contentPieces} content</span>
                      <span>{campaign._count.products} products</span>
                    </div>
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
