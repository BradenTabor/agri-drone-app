"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ListSearchToolbarProps = {
  id: string;
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
};

export function ListSearchToolbar({
  id,
  label,
  placeholder,
  query,
  onQueryChange,
  filteredCount,
  totalCount,
}: ListSearchToolbarProps) {
  return (
    <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.6),rgba(245,250,255,0.4))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_25px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(15,23,42,0.44))]">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-lg space-y-2">
          <Label htmlFor={id} className="text-[0.78rem] tracking-[0.08em] text-muted-foreground uppercase">
            {label}
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={id}
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={placeholder}
              className="rounded-xl border-white/70 bg-white/75 pl-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/15 dark:bg-white/8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/15 dark:bg-white/8">
            {filteredCount} of {totalCount}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-white/20 dark:bg-white/10"
            onClick={() => onQueryChange("")}
            disabled={query.length === 0}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
