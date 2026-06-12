import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SummaryStatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName?: string;
};

export function SummaryStatCard({ label, value, icon: Icon, iconClassName }: SummaryStatCardProps) {
  return (
    <Card className="liquid-reactive liquid-refraction surface-lift rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] sm:rounded-2xl">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.65rem] leading-snug font-medium tracking-[0.06em] text-muted-foreground uppercase sm:text-xs sm:tracking-[0.08em]">
            {label}
          </p>
          <Icon className={cn("size-3.5 shrink-0 sm:size-4", iconClassName)} aria-hidden="true" />
        </div>
        <p className="mt-1.5 text-2xl leading-none font-semibold sm:mt-2 sm:text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

type SummaryStatsGridProps = {
  children: React.ReactNode;
  columns?: 2 | 3;
};

export function SummaryStatsGrid({ children, columns = 3 }: SummaryStatsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-2 sm:gap-3",
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
      )}
    >
      {children}
    </div>
  );
}
