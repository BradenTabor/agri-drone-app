import { AlertTriangle, CircleDot, ShieldCheck } from "lucide-react";

import { ReadinessRing } from "@/components/dashboard/ReadinessRing";
import { DashboardSurface } from "@/components/dashboard/DashboardSurface";
import { cn } from "@/lib/utils";

type DashboardOpsPulseProps = {
  submissionsToday: number;
  openAcreageChecks: number;
  readinessScore: number;
  className?: string;
};

export function DashboardOpsPulse({
  submissionsToday,
  openAcreageChecks,
  readinessScore,
  className,
}: DashboardOpsPulseProps) {
  const needsReview = openAcreageChecks > 0;

  return (
    <DashboardSurface
      variant="inset"
      className={cn(
        "animate-liquid-rise flex flex-col gap-4 bg-white/55 p-3.5 backdrop-blur-2xl sm:p-4 dark:bg-slate-950/35",
        className,
      )}
    >
      <p className="text-xs font-semibold tracking-[0.14em] text-slate-700/80 uppercase dark:text-slate-200/80">
        Ops Pulse
      </p>

      <div className="flex justify-center py-1">
        <ReadinessRing score={readinessScore} size="lg" />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3 border-t border-white/60 pt-2 dark:border-white/10">
          <div className="flex items-center gap-2">
            <CircleDot className="size-4 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
            <span>Submissions today</span>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums">{submissionsToday}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/60 pt-2 dark:border-white/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />
            <span>Acreage checks pending</span>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums">{openAcreageChecks}</span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-white/60 pt-2 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-sky-600 dark:text-sky-300" aria-hidden="true" />
            <span>Readiness status</span>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold",
              needsReview
                ? "border-amber-300/85 bg-amber-100/90 text-amber-800 dark:border-amber-300/25 dark:bg-amber-500/18 dark:text-amber-200"
                : "border-emerald-300/85 bg-emerald-100/90 text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-500/18 dark:text-emerald-200",
            )}
          >
            {needsReview ? "Needs review" : "Healthy"}
          </span>
        </div>
      </div>
    </DashboardSurface>
  );
}
