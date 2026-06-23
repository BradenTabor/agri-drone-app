import { ReadinessRing } from "@/components/dashboard/ReadinessRing";
import { DashboardSurface } from "@/components/dashboard/DashboardSurface";

type DashboardMobileStatsProps = {
  submissionsToday: number;
  openAcreageChecks: number;
  readinessScore: number;
};

export function DashboardMobileStats({
  submissionsToday,
  openAcreageChecks,
  readinessScore,
}: DashboardMobileStatsProps) {
  return (
    <div className="grid grid-cols-3 items-end gap-1.5 md:hidden">
      <DashboardSurface variant="inset" className="px-2 py-2 text-center">
        <p className="text-[0.62rem] font-medium tracking-wide text-muted-foreground uppercase">Today</p>
        <p className="mt-0.5 font-mono text-lg leading-none font-semibold tabular-nums">{submissionsToday}</p>
      </DashboardSurface>
      <DashboardSurface variant="inset" className="px-2 py-2 text-center">
        <p className="text-[0.62rem] font-medium tracking-wide text-muted-foreground uppercase">Pending</p>
        <p className="mt-0.5 font-mono text-lg leading-none font-semibold tabular-nums text-amber-700 dark:text-amber-200">
          {openAcreageChecks}
        </p>
      </DashboardSurface>
      <div className="flex justify-center pb-1">
        <ReadinessRing score={readinessScore} size="sm" />
      </div>
    </div>
  );
}
