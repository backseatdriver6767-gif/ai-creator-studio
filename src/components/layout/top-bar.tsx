"use client";

import { Separator } from "@/components/ui/separator";

export function TopBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <>
      <header className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-3">{children}</div>
      </header>
      <Separator />
    </>
  );
}
