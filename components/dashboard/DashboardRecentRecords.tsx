import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { type DashboardRecentRecord } from "@/components/dashboard/dashboard-tokens";
import { DashboardRecordRow } from "@/components/dashboard/DashboardRecordRow";
import { DashboardSurface } from "@/components/dashboard/DashboardSurface";
import { buttonVariants } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardRecentRecordsProps = {
  records: DashboardRecentRecord[];
};

export function DashboardRecentRecords({ records }: DashboardRecentRecordsProps) {
  return (
    <DashboardSurface variant="card" animationDelayMs={200} className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 sm:p-5 sm:pb-2">
        <CardTitle className="font-heading text-base tracking-tight sm:text-lg">Recent Mix Records</CardTitle>
        <Link
          href="/records"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "press-physics h-8 shrink-0 rounded-xl border border-white/65 bg-white/45 px-2 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-white/70 sm:px-3 dark:border-white/15 dark:bg-white/8 dark:text-slate-100 dark:hover:bg-white/15",
          )}
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-1 sm:space-y-2.5 sm:p-5 sm:pt-2">
        {!records.length ? (
          <div className="space-y-3 rounded-xl border border-dashed border-white/60 bg-white/30 p-4 text-center dark:border-white/15 dark:bg-white/5">
            <p className="text-sm text-muted-foreground">
              No records yet. Create your first mix record to get started.
            </p>
            <Link
              href="/records/new"
              className={cn(
                buttonVariants(),
                "press-physics inline-flex min-h-10 rounded-xl bg-[var(--brand-forest)] text-emerald-50 hover:bg-emerald-900 dark:bg-emerald-600 dark:text-emerald-950",
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
              New Mix Record
            </Link>
          </div>
        ) : (
          records.map((record) => <DashboardRecordRow key={record.id} record={record} />)
        )}
      </CardContent>
    </DashboardSurface>
  );
}
