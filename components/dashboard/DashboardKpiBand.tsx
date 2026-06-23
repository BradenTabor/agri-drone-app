import { type DashboardKpi } from "@/components/dashboard/dashboard-tokens";
import { DashboardKpiCard } from "@/components/dashboard/DashboardKpiCard";
import { cn } from "@/lib/utils";

type DashboardKpiBandProps = {
  kpis: DashboardKpi[];
};

export function DashboardKpiBand({ kpis }: DashboardKpiBandProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      {kpis.map((kpi, index) => (
        <div key={kpi.label} className={cn(index === 0 && "col-span-2")}>
          <DashboardKpiCard
            kpi={kpi}
            featured={index === 0}
            animationDelayMs={index * 80 + 120}
          />
        </div>
      ))}
    </div>
  );
}
