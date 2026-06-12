"use client";

import Link from "next/link";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MapDateFilterPanelProps = {
  dateFrom?: string;
  dateTo?: string;
  pointCount: number;
};

function countActiveFilters(dateFrom?: string, dateTo?: string): number {
  return [dateFrom, dateTo].filter((value) => typeof value === "string" && value.trim()).length;
}

export function MapDateFilterPanel({ dateFrom, dateTo, pointCount }: MapDateFilterPanelProps) {
  const activeCount = useMemo(() => countActiveFilters(dateFrom, dateTo), [dateFrom, dateTo]);
  const [expanded, setExpanded] = useState(activeCount > 0);

  return (
    <div className="liquid-reactive rounded-xl border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl sm:rounded-2xl dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(15,23,42,0.44))]">
      <form method="get" className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/15 dark:bg-white/8">
            {pointCount} pin{pointCount === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 dark:border-white/20 dark:bg-white/10"
              onClick={() => setExpanded((current) => !current)}
              aria-expanded={expanded}
            >
              <SlidersHorizontal className="size-3.5" />
              Dates
              {activeCount > 0 ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                  {activeCount}
                </span>
              ) : null}
              <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
            </Button>
            {activeCount > 0 ? (
              <Link
                href="/map"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "rounded-xl px-2",
                })}
                aria-label="Clear date filters"
              >
                <X className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>

        {expanded ? (
          <div className="mt-3 grid gap-3 border-t border-white/55 pt-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end dark:border-white/10">
            <div className="grid gap-1">
              <Label htmlFor="dateFrom" className="text-xs font-normal text-muted-foreground">
                Date from
              </Label>
              <Input
                id="dateFrom"
                name="dateFrom"
                type="date"
                defaultValue={dateFrom ?? ""}
                className="rounded-xl border-white/70 bg-white/75 dark:border-white/15 dark:bg-white/8"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="dateTo" className="text-xs font-normal text-muted-foreground">
                Date to
              </Label>
              <Input
                id="dateTo"
                name="dateTo"
                type="date"
                defaultValue={dateTo ?? ""}
                className="rounded-xl border-white/70 bg-white/75 dark:border-white/15 dark:bg-white/8"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="rounded-xl">
              Apply
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
