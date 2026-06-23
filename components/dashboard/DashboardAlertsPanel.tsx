import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { DashboardSurface } from "@/components/dashboard/DashboardSurface";
import { buttonVariants } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardAlertsPanelProps = {
  openAcreageChecks: number;
};

export function DashboardAlertsPanel({ openAcreageChecks }: DashboardAlertsPanelProps) {
  return (
    <DashboardSurface variant="card" animationDelayMs={260}>
      <CardHeader className="p-3 pb-1 sm:p-5 sm:pb-2">
        <CardTitle className="font-heading text-base tracking-tight sm:text-lg">Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 sm:p-5 sm:pt-2">
        {openAcreageChecks > 0 ? (
          <DashboardSurface
            variant="alert"
            className="border-amber-300/90 bg-amber-50/90 p-2.5 text-sm sm:p-3 dark:border-amber-400/20 dark:bg-amber-500/10"
          >
            <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              {openAcreageChecks} records missing actual acres
            </p>
            <p className="mt-1 text-xs break-words text-amber-800/95 sm:text-sm dark:text-amber-100/80">
              Review these before close-of-day to avoid incomplete records.
            </p>
            <Link
              href="/records"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "press-physics mt-3 inline-flex w-full justify-center rounded-xl border-amber-400/60 bg-white/70 text-amber-900 hover:bg-white dark:border-amber-300/30 dark:bg-white/10 dark:text-amber-100",
              )}
            >
              Review records
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </DashboardSurface>
        ) : (
          <DashboardSurface
            variant="alert"
            className={cn(
              "border-emerald-300/90 bg-emerald-50/90 p-2.5 text-sm text-emerald-900 sm:p-3",
              "dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100",
            )}
          >
            All recent records have acreage captured.
          </DashboardSurface>
        )}
      </CardContent>
    </DashboardSurface>
  );
}
