import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  Gauge,
  Sprout,
  Users2,
} from "lucide-react";

export type KpiTone = "emerald" | "sky" | "amber" | "violet" | "gold";

export type DashboardKpi = {
  label: string;
  value: number;
  hint: string;
  tone: KpiTone;
  icon: LucideIcon;
  href: string;
};

export type DashboardRecentRecord = {
  id: string;
  record_date: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  signed_typed_name: string;
  actual_acres: number | null;
};

export const kpiToneStyles: Record<KpiTone, string> = {
  emerald:
    "from-emerald-100/85 to-emerald-50/55 text-emerald-800 ring-emerald-200/70 dark:from-emerald-500/20 dark:to-emerald-400/8 dark:text-emerald-100 dark:ring-emerald-300/30",
  sky: "from-sky-100/85 to-sky-50/55 text-sky-800 ring-sky-200/70 dark:from-sky-500/20 dark:to-sky-400/8 dark:text-sky-100 dark:ring-sky-300/30",
  amber:
    "from-amber-100/90 to-amber-50/60 text-amber-800 ring-amber-200/70 dark:from-amber-500/20 dark:to-amber-400/8 dark:text-amber-100 dark:ring-amber-300/30",
  violet:
    "from-violet-100/90 to-violet-50/60 text-violet-800 ring-violet-200/70 dark:from-violet-500/20 dark:to-violet-400/8 dark:text-violet-100 dark:ring-violet-300/30",
  gold: "from-amber-100/95 to-yellow-50/70 text-amber-900 ring-amber-300/80 dark:from-amber-500/22 dark:to-yellow-400/10 dark:text-amber-100 dark:ring-amber-300/35",
};

export function buildDashboardKpis(input: {
  mixToday: number;
  appToday: number;
  openAcreageChecks: number;
  activeCustomers: number;
}): DashboardKpi[] {
  return [
    {
      label: "Mix records today",
      value: input.mixToday,
      hint: "Submitted since midnight UTC",
      tone: "gold",
      icon: Sprout,
      href: "/records",
    },
    {
      label: "Application records today",
      value: input.appToday,
      hint: "Field application log volume",
      tone: "sky",
      icon: ClipboardCheck,
      href: "/app-records",
    },
    {
      label: "Open acreage checks",
      value: input.openAcreageChecks,
      hint: "Records missing actual acres",
      tone: "amber",
      icon: Gauge,
      href: "/records",
    },
    {
      label: "Active customers",
      value: input.activeCustomers,
      hint: "Available for new records",
      tone: "violet",
      icon: Users2,
      href: "/customers",
    },
  ];
}

export function computeReadinessScore(openAcreageChecks: number): number {
  return Math.max(35, Math.min(100, 100 - openAcreageChecks * 12));
}

export function formatDashboardDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDashboardDateLong(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
