import {
  buildDashboardKpis,
  computeReadinessScore,
  type DashboardRecentRecord,
} from "@/components/dashboard/dashboard-tokens";
import { DashboardMobileAlertsBar } from "@/components/dashboard/DashboardMobileAlertsBar";
import { DashboardActionsPanel } from "@/components/dashboard/DashboardActionsPanel";
import { DashboardAlertsPanel } from "@/components/dashboard/DashboardAlertsPanel";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardKpiBand } from "@/components/dashboard/DashboardKpiBand";
import { DashboardRecentRecords } from "@/components/dashboard/DashboardRecentRecords";

type DashboardPageContentProps = {
  todayIso: string;
  records: DashboardRecentRecord[];
  mixToday: number;
  appToday: number;
  openAcreageChecks: number;
  activeCustomers: number;
};

export function DashboardPageContent({
  todayIso,
  records,
  mixToday,
  appToday,
  openAcreageChecks,
  activeCustomers,
}: DashboardPageContentProps) {
  const submissionsToday = mixToday + appToday;
  const readinessScore = computeReadinessScore(openAcreageChecks);
  const kpis = buildDashboardKpis({
    mixToday,
    appToday,
    openAcreageChecks,
    activeCustomers,
  });

  return (
    <section className="space-y-3 pb-20 sm:space-y-5 md:space-y-6 lg:pb-0">
      <DashboardHero
        todayIso={todayIso}
        submissionsToday={submissionsToday}
        openAcreageChecks={openAcreageChecks}
        readinessScore={readinessScore}
      />

      <DashboardKpiBand kpis={kpis} />

      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <DashboardRecentRecords records={records} />

        <div className="grid gap-3 lg:sticky lg:top-24 lg:self-start lg:space-y-4">
          <div className="hidden lg:block">
            <DashboardAlertsPanel openAcreageChecks={openAcreageChecks} />
          </div>
          <DashboardActionsPanel />
        </div>
      </div>

      <DashboardMobileAlertsBar openAcreageChecks={openAcreageChecks} />
    </section>
  );
}
