"use client";

import { use } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCampaign, useUpdateCampaign } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Film, Plus, ShoppingBag } from "lucide-react";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useCampaign(id);
  const updateCampaign = useUpdateCampaign(id);

  const campaign = data as {
    id: string;
    name: string;
    description: string | null;
    niche: string | null;
    productUrl: string | null;
    checkoutUrl: string | null;
    manychatKeyword: string | null;
    platforms: string[];
    status: string;
    persona: { id: string; name: string };
    contentPieces: { id: string; title: string; status: string; type: string }[];
    products: { id: string; name: string; price: number }[];
  } | undefined;

  const handleStatusChange = async (status: string) => {
    try {
      await updateCampaign.mutateAsync({ status });
      toast.success(`Campaign ${status.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  if (isLoading) {
    return (
      <div>
        <TopBar title="Loading..." />
        <div className="p-6 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div>
        <TopBar title="Not Found" />
        <div className="p-6"><p className="text-muted-foreground">Campaign not found</p></div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title={campaign.name}>
        <StatusBadge status={campaign.status} />
        <div className="flex gap-2">
          {campaign.status === "DRAFT" && (
            <Button size="sm" onClick={() => handleStatusChange("ACTIVE")}>Activate</Button>
          )}
          {campaign.status === "ACTIVE" && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("PAUSED")}>Pause</Button>
          )}
          {campaign.status === "PAUSED" && (
            <Button size="sm" onClick={() => handleStatusChange("ACTIVE")}>Resume</Button>
          )}
        </div>
      </TopBar>
      <div className="p-6 space-y-6">
        <div className="grid gap-4 grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persona</span>
                <Link href={`/personas/${campaign.persona.id}`} className="hover:underline">
                  {campaign.persona.name}
                </Link>
              </div>
              <Separator />
              {campaign.niche && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niche</span>
                    <span>{campaign.niche}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platforms</span>
                <div className="flex gap-1">
                  {campaign.platforms.map((p) => <StatusBadge key={p} status={p} />)}
                </div>
              </div>
              {campaign.manychatKeyword && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ManyChat Keyword</span>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{campaign.manychatKeyword}</code>
                  </div>
                </>
              )}
              {campaign.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Description</p>
                    <p>{campaign.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Products</CardTitle>
                <Link href={`/products/new?campaignId=${campaign.id}`}>
                  <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!campaign.products.length ? (
                <p className="text-sm text-muted-foreground">No products linked</p>
              ) : (
                <div className="space-y-2">
                  {campaign.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{product.name}</span>
                      </div>
                      <span className="text-sm font-medium">${(product.price / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Content ({campaign.contentPieces.length})</CardTitle>
              <Link href={`/content/new?personaId=${campaign.persona.id}&campaignId=${campaign.id}`}>
                <Button size="sm"><Plus className="h-3 w-3 mr-1" /> New Content</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!campaign.contentPieces.length ? (
              <p className="text-sm text-muted-foreground">No content yet</p>
            ) : (
              <div className="space-y-2">
                {campaign.contentPieces.map((piece) => (
                  <Link key={piece.id} href={`/content/${piece.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{piece.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={piece.type} />
                        <StatusBadge status={piece.status} />
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
