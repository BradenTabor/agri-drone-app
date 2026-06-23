import Link from "next/link";
import { ClipboardCheck, MapPinned, Plus } from "lucide-react";

import { DashboardHeroVisual } from "@/components/dashboard/DashboardHeroVisual";
import { DashboardMobileStats } from "@/components/dashboard/DashboardMobileStats";
import { DashboardOpsPulse } from "@/components/dashboard/DashboardOpsPulse";
import { DashboardSurface } from "@/components/dashboard/DashboardSurface";
import { formatDashboardDateLong } from "@/components/dashboard/dashboard-tokens";
import { buttonVariants } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardHeroProps = {
  todayIso: string;
  submissionsToday: number;
  openAcreageChecks: number;
  readinessScore: number;
};

export function DashboardHero({
  todayIso,
  submissionsToday,
  openAcreageChecks,
  readinessScore,
}: DashboardHeroProps) {
  const dateLabel = formatDashboardDateLong(todayIso);

  return (
    <DashboardSurface variant="hero">
      <DashboardHeroVisual />
      <div className="animate-liquid-shimmer pointer-events-none absolute inset-y-0 -left-1/3 z-[1] w-2/3 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.26),transparent)] dark:bg-[linear-gradient(110deg,transparent,rgba(148,163,184,0.15),transparent)]" />
      <CardContent className="relative z-[2] grid gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-2.5 sm:space-y-3">
          <div className="space-y-1.5 sm:space-y-2.5">
            <p className="inline-flex rounded-full border border-white/70 bg-white/48 px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.16em] text-emerald-800 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-2.5 sm:py-1 sm:text-[0.68rem] sm:tracking-[0.18em] dark:border-emerald-200/20 dark:bg-emerald-500/12 dark:text-emerald-100">
              Today&apos;s Operations
            </p>
            <h1 className="font-heading text-xl leading-[1.1] font-semibold tracking-tight text-[var(--brand-forest)] sm:text-3xl md:text-[2.65rem] dark:text-slate-50">
              Operations Command
            </h1>
            <p className="max-w-2xl text-sm text-slate-700 sm:text-base dark:text-slate-200/85">
              Efficient workflows for field-ready records — surface compliance risk early and keep crews moving.
            </p>
            <p className="text-xs font-medium tracking-wide text-muted-foreground sm:text-sm">{dateLabel}</p>
          </div>

          <div className="grid gap-2">
            <Link
              href="/records/new"
              className={cn(
                buttonVariants(),
                "press-physics liquid-refraction min-h-11 w-full justify-center rounded-xl border border-emerald-700/30 bg-[var(--brand-forest)] text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_10px_18px_rgba(26,61,46,0.28)] hover:bg-emerald-900 sm:min-h-12 dark:border-emerald-300/25 dark:bg-emerald-600 dark:text-emerald-950 dark:hover:bg-emerald-500",
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
              New Mix Record
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/app-records/new"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "press-physics min-h-11 justify-center rounded-xl border-[var(--brand-forest)]/25 bg-white/50 px-2 text-sm text-[var(--brand-forest)] shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] hover:bg-white/75 dark:border-white/20 dark:bg-slate-950/25 dark:text-slate-100 dark:hover:bg-slate-100/12",
                )}
              >
                <ClipboardCheck className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">App Record</span>
              </Link>
              <Link
                href="/map"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "press-physics min-h-11 justify-center rounded-xl border-[var(--brand-forest)]/25 bg-white/50 px-2 text-sm text-[var(--brand-forest)] shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] hover:bg-white/75 dark:border-white/20 dark:bg-slate-950/20 dark:text-slate-100 dark:hover:bg-slate-100/12",
                )}
              >
                <MapPinned className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Open Map</span>
              </Link>
            </div>
          </div>

          <DashboardMobileStats
            submissionsToday={submissionsToday}
            openAcreageChecks={openAcreageChecks}
            readinessScore={readinessScore}
          />
        </div>

        <DashboardOpsPulse
          className="hidden md:flex"
          submissionsToday={submissionsToday}
          openAcreageChecks={openAcreageChecks}
          readinessScore={readinessScore}
        />
      </CardContent>
    </DashboardSurface>
  );
}
