import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  type DashboardKpi,
  kpiToneStyles,
} from "@/components/dashboard/dashboard-tokens";
import { DashboardSurface } from "@/components/dashboard/DashboardSurface";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardKpiCardProps = {
  kpi: DashboardKpi;
  featured?: boolean;
  animationDelayMs?: number;
};

export function DashboardKpiCard({ kpi, featured = false, animationDelayMs }: DashboardKpiCardProps) {
  return (
    <DashboardSurface
      animationDelayMs={animationDelayMs}
      className={cn(featured && "ring-1 ring-amber-300/40 dark:ring-amber-400/20")}
    >
      <CardContent className="p-0">
        <Link
          href={kpi.href}
          className={cn(
            "press-physics block rounded-xl p-3 sm:rounded-2xl sm:p-4",
            featured && "sm:p-5",
          )}
        >
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-[0.65rem] leading-snug font-medium tracking-[0.06em] text-muted-foreground uppercase sm:text-xs sm:tracking-[0.09em]">
              {kpi.label}
            </p>
            <span
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ring-1 sm:size-8",
                kpiToneStyles[kpi.tone],
              )}
            >
              <kpi.icon className="size-3.5 sm:size-4" aria-hidden="true" />
            </span>
          </div>
          <p
            className={cn(
              "mt-1.5 font-mono leading-none font-semibold tracking-tight tabular-nums sm:mt-2",
              featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
            )}
          >
            {kpi.value}
          </p>
          <div className="mt-1.5 hidden items-center justify-between gap-2 sm:mt-2 sm:flex">
            <p className="text-xs text-muted-foreground">{kpi.hint}</p>
            <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </div>
        </Link>
      </CardContent>
    </DashboardSurface>
  );
}
