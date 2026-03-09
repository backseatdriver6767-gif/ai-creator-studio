"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useContentPieces } from "@/lib/hooks";
import { Plus, Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function ContentPage() {
  const { data, isLoading } = useContentPieces();
  const pieces = data as {
    id: string;
    title: string;
    status: string;
    type: string;
    format: string;
    platform: string[];
    createdAt: string;
    persona: { id: string; name: string };
  }[] | undefined;

  return (
    <div>
      <TopBar title="Content Library">
        <Link href="/content/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Content</Button>
        </Link>
      </TopBar>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !pieces?.length ? (
          <EmptyState
            icon={Film}
            title="No content yet"
            description="Create your first content piece to start the generation pipeline"
            action={
              <Link href="/content/new">
                <Button><Plus className="h-4 w-4 mr-2" /> Create Content</Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieces.map((piece) => (
                <TableRow key={piece.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/content/${piece.id}`} className="font-medium hover:underline">
                      {piece.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/personas/${piece.persona.id}`} className="text-muted-foreground hover:underline">
                      {piece.persona.name}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge status={piece.type} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {piece.platform.map((p) => (
                        <StatusBadge key={p} status={p} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={piece.status} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(piece.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
