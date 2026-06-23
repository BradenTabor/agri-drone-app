"use client";

import Link from "next/link";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type DashboardMobileAlertsBarProps = {
  openAcreageChecks: number;
};

export function DashboardMobileAlertsBar({ openAcreageChecks }: DashboardMobileAlertsBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (openAcreageChecks <= 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 pb-3 lg:hidden">
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-2xl border border-amber-300/80 bg-amber-50/95 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-amber-400/25 dark:bg-amber-950/90 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
          expanded && "rounded-2xl",
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="press-physics flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          aria-expanded={expanded}
        >
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {openAcreageChecks} active alert{openAcreageChecks === 1 ? "" : "s"}
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-amber-800 transition-transform dark:text-amber-200", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        {expanded ? (
          <div className="space-y-2 border-t border-amber-300/50 px-3 py-2.5 dark:border-amber-400/20">
            <p className="text-xs text-amber-900/90 dark:text-amber-100/85">
              {openAcreageChecks} record{openAcreageChecks === 1 ? "" : "s"} missing actual acres. Review before
              close-of-day.
            </p>
            <Link
              href="/records"
              className="press-physics inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[var(--brand-forest)] px-3 text-sm font-medium text-emerald-50"
            >
              Review records
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
