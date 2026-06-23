import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { type DashboardRecentRecord } from "@/components/dashboard/dashboard-tokens";
import { DashboardSurface } from "@/components/dashboard/DashboardSurface";
import { cn } from "@/lib/utils";

type DashboardRecordRowProps = {
  record: DashboardRecentRecord;
};

function isPending(record: DashboardRecentRecord): boolean {
  return record.actual_acres == null;
}

export function DashboardRecordRow({ record }: DashboardRecordRowProps) {
  const pending = isPending(record);

  return (
    <Link href={`/records/${record.id}`} className="press-physics group block">
      <DashboardSurface
        variant="inset"
        className="flex items-stretch gap-0 overflow-hidden p-0 transition-colors hover:bg-white/62 dark:hover:bg-white/8"
      >
        <div
          className={cn(
            "w-1 shrink-0",
            pending ? "bg-amber-500 dark:bg-amber-400" : "bg-emerald-600 dark:bg-emerald-400",
          )}
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-semibold tabular-nums">{record.record_date}</p>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[0.62rem] leading-none font-semibold uppercase tracking-wide sm:text-xs",
                  pending
                    ? "border-amber-300/80 bg-amber-100 text-amber-800 dark:border-amber-300/25 dark:bg-amber-500/20 dark:text-amber-100"
                    : "border-emerald-300/80 bg-emerald-100 text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-500/20 dark:text-emerald-100",
                )}
              >
                {pending ? "Pending" : "Complete"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-700 dark:text-slate-200">
              {record.customer_name_snapshot || "—"}
              {record.field_name_snapshot ? ` · ${record.field_name_snapshot}` : ""}
            </p>
            <p className="truncate text-xs text-muted-foreground">{record.signed_typed_name || "—"}</p>
          </div>
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </DashboardSurface>
    </Link>
  );
}
