"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { usePersonas } from "@/lib/hooks";
import { Plus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PersonasPage() {
  const { data, isLoading } = usePersonas();
  const personas = data as {
    id: string;
    name: string;
    description: string | null;
    status: string;
    imageUrls: string[] | null;
    _count: { contentPieces: number; campaigns: number };
  }[] | undefined;

  return (
    <div>
      <TopBar title="AI Personas">
        <Link href="/personas/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Persona</Button>
        </Link>
      </TopBar>
      <div className="p-6">
        {isLoading ? (
          <div className="grid gap-4 grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : !personas?.length ? (
          <EmptyState
            icon={Users}
            title="No personas yet"
            description="Create your first AI persona to start generating content"
            action={
              <Link href="/personas/new">
                <Button><Plus className="h-4 w-4 mr-2" /> Create Persona</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-3">
            {personas.map((persona) => (
              <Link key={persona.id} href={`/personas/${persona.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{persona.name}</CardTitle>
                      <StatusBadge status={persona.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {persona.description || "No description"}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{persona._count.contentPieces} content pieces</span>
                      <span>{persona._count.campaigns} campaigns</span>
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
