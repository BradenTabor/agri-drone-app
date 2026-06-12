import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CircleDot,
  ClipboardCheck,
  Gauge,
  MapPinned,
  Plus,
  ShieldCheck,
  Sprout,
  Users2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type RecentRecord = {
  id: string;
  record_date: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  signed_typed_name: string;
  actual_acres: number | null;
};

type KpiTone = "emerald" | "sky" | "amber" | "violet";

export default async function AppLandingPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();
  const [
    { data: recentRecords, error: recentRecordsError },
    { count: mixTodayCount, error: mixTodayError },
    { count: appTodayCount, error: appTodayError },
    { count: pendingAcreageCount, error: pendingAcreageError },
    { count: customersCount, error: customersError },
  ] = await Promise.all([
    supabase
      .from("mix_records")
      .select("id,record_date,customer_name_snapshot,field_name_snapshot,signed_typed_name,actual_acres")
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false })
      .limit(8),
    supabase
      .from("mix_records")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("record_date", todayIso),
    supabase
      .from("app_records")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("job_date", todayIso),
    supabase
      .from("mix_records")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .is("actual_acres", null),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  if (recentRecordsError || mixTodayError || appTodayError || pendingAcreageError || customersError) {
    throw new Error("Unable to load dashboard.");
  }

  const records = (recentRecords ?? []) as RecentRecord[];
  const mixToday = mixTodayCount ?? 0;
  const appToday = appTodayCount ?? 0;
  const openAcreageChecks = pendingAcreageCount ?? 0;
  const activeCustomers = customersCount ?? 0;
  const submissionsToday = mixToday + appToday;
  const readinessScore = Math.max(35, Math.min(100, 100 - openAcreageChecks * 12));

  const kpis: {
    label: string;
    value: number;
    hint: string;
    tone: KpiTone;
    icon: LucideIcon;
    href: string;
  }[] = [
    {
      label: "Mix records today",
      value: mixToday,
      hint: "Submitted since midnight UTC",
      tone: "emerald",
      icon: Sprout,
      href: "/records",
    },
    {
      label: "Application records today",
      value: appToday,
      hint: "Field application log volume",
      tone: "sky",
      icon: ClipboardCheck,
      href: "/app-records",
    },
    {
      label: "Open acreage checks",
      value: openAcreageChecks,
      hint: "Records missing actual acres",
      tone: "amber",
      icon: Gauge,
      href: "/records",
    },
    {
      label: "Active customers",
      value: activeCustomers,
      hint: "Available for new records",
      tone: "violet",
      icon: Users2,
      href: "/customers",
    },
  ];

  const kpiToneStyles: Record<KpiTone, string> = {
    emerald:
      "from-emerald-100/85 to-emerald-50/55 text-emerald-700 ring-emerald-200/70 dark:from-emerald-500/20 dark:to-emerald-400/8 dark:text-emerald-100 dark:ring-emerald-300/30",
    sky: "from-sky-100/85 to-sky-50/55 text-sky-700 ring-sky-200/70 dark:from-sky-500/20 dark:to-sky-400/8 dark:text-sky-100 dark:ring-sky-300/30",
    amber:
      "from-amber-100/90 to-amber-50/60 text-amber-700 ring-amber-200/70 dark:from-amber-500/20 dark:to-amber-400/8 dark:text-amber-100 dark:ring-amber-300/30",
    violet:
      "from-violet-100/90 to-violet-50/60 text-violet-700 ring-violet-200/70 dark:from-violet-500/20 dark:to-violet-400/8 dark:text-violet-100 dark:ring-violet-300/30",
  };

  return (
    <section className="space-y-3 sm:space-y-5 md:space-y-6">
      <Card className="glass-noise liquid-reactive liquid-refraction surface-lift animate-liquid-rise relative overflow-hidden rounded-[22px] border-white/65 bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(237,247,244,0.36))] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-3xl sm:rounded-[26px] dark:border-white/15 dark:bg-[linear-gradient(135deg,rgba(8,16,24,0.84),rgba(16,34,27,0.7))] dark:text-slate-100 dark:shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
        <div className="animate-liquid-float pointer-events-none absolute -top-14 -right-16 size-56 rounded-full bg-emerald-200/55 blur-3xl dark:bg-emerald-500/18" />
        <div className="animate-liquid-float pointer-events-none absolute -bottom-20 left-10 size-64 rounded-full bg-sky-100/45 blur-3xl dark:bg-sky-500/12" />
        <div className="animate-liquid-shimmer pointer-events-none absolute inset-y-0 -left-1/3 w-2/3 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.26),transparent)] dark:bg-[linear-gradient(110deg,transparent,rgba(148,163,184,0.15),transparent)]" />
        <CardContent className="relative grid gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-2.5 sm:space-y-3">
            <div className="space-y-1.5 sm:space-y-2.5">
              <p className="inline-flex rounded-full border border-white/70 bg-white/48 px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.16em] text-emerald-700 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-2.5 sm:py-1 sm:text-[0.68rem] sm:tracking-[0.18em] dark:border-emerald-200/20 dark:bg-emerald-500/12 dark:text-emerald-100">
                Today&apos;s Operations
              </p>
              <h1 className="text-xl leading-tight font-semibold tracking-tight sm:text-3xl md:text-4xl">
                Field-ready dashboard
              </h1>
              <p className="hidden max-w-2xl text-base text-slate-700 sm:block dark:text-slate-200/85">
                Run record workflows faster, surface compliance risk early, and keep crews moving with clear next actions.
              </p>
            </div>
            <div className="grid gap-2">
              <Link
                href="/records/new"
                className={cn(
                  buttonVariants(),
                  "press-physics liquid-refraction animate-pulse-soft min-h-10 w-full justify-center rounded-xl border border-emerald-300/80 bg-emerald-400/95 text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_10px_18px_rgba(16,185,129,0.22)] hover:bg-emerald-300 sm:min-h-11 dark:border-emerald-300/35 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400",
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
                    "press-physics liquid-refraction min-h-10 justify-center rounded-xl border-white/70 bg-white/44 px-2 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] hover:bg-white/68 dark:border-slate-200/20 dark:bg-slate-950/25 dark:text-slate-100 dark:hover:bg-slate-100/12",
                  )}
                >
                  <ClipboardCheck className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">App Record</span>
                </Link>
                <Link
                  href="/map"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "press-physics liquid-refraction min-h-10 justify-center rounded-xl border-white/70 bg-white/44 px-2 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] hover:bg-white/68 dark:border-slate-200/20 dark:bg-slate-950/20 dark:text-slate-100 dark:hover:bg-slate-100/12",
                  )}
                >
                  <MapPinned className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">Open Map</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 md:hidden">
              <div className="rounded-xl border border-white/70 bg-white/44 px-2 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/5">
                <p className="text-[0.62rem] font-medium tracking-wide text-muted-foreground uppercase">Today</p>
                <p className="mt-0.5 text-lg leading-none font-semibold">{submissionsToday}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/44 px-2 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/5">
                <p className="text-[0.62rem] font-medium tracking-wide text-muted-foreground uppercase">Pending</p>
                <p className="mt-0.5 text-lg leading-none font-semibold">{openAcreageChecks}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/44 px-2 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/5">
                <p className="text-[0.62rem] font-medium tracking-wide text-muted-foreground uppercase">Ready</p>
                <p className="mt-0.5 text-lg leading-none font-semibold">{readinessScore}%</p>
              </div>
            </div>
          </div>

          <div className="liquid-reactive animate-liquid-rise hidden rounded-2xl border border-white/65 bg-white/38 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-2xl md:block dark:border-white/15 dark:bg-slate-950/28 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-slate-700/80 uppercase dark:text-slate-200/80">Ops Pulse</p>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/44 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <div className="flex items-center gap-2">
                  <CircleDot className="size-4 text-emerald-500 dark:text-emerald-300" aria-hidden="true" />
                  <span>Submissions today</span>
                </div>
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-white/70 px-2 py-0.5 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] dark:bg-white/12">
                  {submissionsToday}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/44 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500 dark:text-amber-300" aria-hidden="true" />
                  <span>Acreage checks pending</span>
                </div>
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-white/70 px-2 py-0.5 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] dark:bg-white/12">
                  {openAcreageChecks}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/70 bg-white/44 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-sky-500 dark:text-sky-300" aria-hidden="true" />
                  <span>Readiness status</span>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold sm:text-sm",
                    openAcreageChecks > 0
                      ? "border-amber-300/85 bg-amber-100/90 text-amber-700 dark:border-amber-300/25 dark:bg-amber-500/18 dark:text-amber-200"
                      : "border-emerald-300/85 bg-emerald-100/90 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-500/18 dark:text-emerald-200",
                  )}
                >
                  {openAcreageChecks > 0 ? "Needs review" : "Healthy"}
                </span>
              </div>
              <div className="space-y-1.5 rounded-xl border border-white/70 bg-white/44 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium tracking-[0.08em] text-slate-600 uppercase dark:text-slate-300/85">
                    Readiness score
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-100">{readinessScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/65 dark:bg-white/12">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      readinessScore < 70
                        ? "bg-amber-500/75 dark:bg-amber-400/70"
                        : "bg-emerald-500/75 dark:bg-emerald-400/70",
                    )}
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card
            key={kpi.label}
            className="liquid-reactive liquid-refraction surface-lift animate-liquid-rise rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.54),rgba(244,249,255,0.34))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:rounded-2xl dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(15,23,42,0.4))] dark:shadow-[0_12px_30px_rgba(2,6,23,0.25)]"
            style={{ animationDelay: `${index * 80 + 120}ms` }}
          >
            <CardContent className="p-0">
              <Link href={kpi.href} className="press-physics liquid-refraction block rounded-xl p-3 sm:rounded-2xl sm:p-4">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="text-[0.65rem] leading-snug font-medium tracking-[0.06em] text-muted-foreground uppercase sm:text-xs sm:tracking-[0.09em]">
                    {kpi.label}
                  </p>
                  <span
                    className={cn(
                      "inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ring-1 sm:size-8",
                      kpiToneStyles[kpi.tone],
                    )}
                  >
                    <kpi.icon className="size-3.5 sm:size-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-1.5 text-2xl leading-none font-semibold tracking-tight sm:mt-2 sm:text-3xl">{kpi.value}</p>
                <div className="mt-1.5 hidden items-center justify-between gap-2 sm:mt-2 sm:flex">
                  <p className="text-xs text-muted-foreground">{kpi.hint}</p>
                  <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <Card className="liquid-reactive liquid-refraction surface-lift animate-liquid-rise rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.52),rgba(244,249,255,0.34))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:rounded-2xl dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(15,23,42,0.4))] dark:shadow-[0_12px_30px_rgba(2,6,23,0.25)] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 p-3 pb-1 sm:p-5 sm:pb-2">
            <CardTitle className="text-base tracking-tight sm:text-lg">Recent Mix Records</CardTitle>
            <Link
              href="/records"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "press-physics liquid-refraction h-8 shrink-0 rounded-xl border border-white/65 bg-white/45 px-2 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] hover:bg-white/70 sm:px-3 dark:border-white/15 dark:bg-white/8 dark:text-slate-100 dark:hover:bg-white/15",
              )}
            >
              View all
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent className="p-3 pt-1 sm:p-5 sm:pt-2">
            {!records.length ? (
              <p className="text-sm text-muted-foreground">No records yet. Create your first mix record to get started.</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto rounded-xl border border-white/65 bg-white/42 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/15 dark:bg-white/5 dark:shadow-none md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-[linear-gradient(145deg,rgba(255,255,255,0.68),rgba(244,249,255,0.38))] text-left text-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
                      <tr>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Customer / Field</th>
                        <th className="px-3 py-2 font-medium">Applicator</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr
                          key={record.id}
                          className="border-t border-white/45 transition-colors hover:bg-white/35 dark:border-white/10 dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-3 py-2">{record.record_date}</td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            {record.customer_name_snapshot || "—"} / {record.field_name_snapshot || "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{record.signed_typed_name || "—"}</td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs leading-none font-semibold",
                                record.actual_acres == null
                                  ? "border-amber-300/80 bg-amber-100 text-amber-800 dark:border-amber-300/25 dark:bg-amber-500/20 dark:text-amber-100"
                                  : "border-emerald-300/80 bg-emerald-100 text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-500/20 dark:text-emerald-100",
                              )}
                            >
                              {record.actual_acres == null ? "Needs acreage check" : "Complete"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              href={`/records/${record.id}`}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "press-physics liquid-refraction rounded-xl border-white/70 bg-white/62 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] hover:bg-white/80 dark:border-white/20 dark:bg-white/8 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/15",
                              )}
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-white/55 md:hidden dark:divide-white/10">
                  {records.map((record) => (
                    <Link
                      key={`${record.id}-mobile`}
                      href={`/records/${record.id}`}
                      className="press-physics flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{record.record_date}</p>
                          <span
                            className={cn(
                              "inline-flex shrink-0 rounded-full border px-1.5 py-0.5 text-[0.62rem] leading-none font-semibold",
                              record.actual_acres == null
                                ? "border-amber-300/80 bg-amber-100 text-amber-800 dark:border-amber-300/25 dark:bg-amber-500/20 dark:text-amber-100"
                                : "border-emerald-300/80 bg-emerald-100 text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-500/20 dark:text-emerald-100",
                            )}
                          >
                            {record.actual_acres == null ? "Pending" : "Done"}
                          </span>
                        </div>
                        <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                          {record.customer_name_snapshot || "—"}
                          {record.field_name_snapshot ? ` · ${record.field_name_snapshot}` : ""}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{record.signed_typed_name || "—"}</p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:space-y-0 lg:space-y-4">
          <Card className="liquid-reactive liquid-refraction surface-lift animate-liquid-rise rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.52),rgba(244,249,255,0.34))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:rounded-2xl dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(15,23,42,0.4))] dark:shadow-[0_12px_30px_rgba(2,6,23,0.25)]">
            <CardHeader className="p-3 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base tracking-tight sm:text-lg">Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-1 sm:p-5 sm:pt-2">
              {openAcreageChecks > 0 ? (
                <div className="rounded-xl border border-amber-300/90 bg-amber-50/90 p-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-3 dark:border-amber-400/20 dark:bg-amber-500/10 dark:shadow-none">
                  <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                    {openAcreageChecks} records missing actual acres
                  </p>
                  <p className="mt-1 text-xs break-words text-amber-800/95 sm:text-sm dark:text-amber-100/80">
                    Review these before close-of-day to avoid incomplete records.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-300/90 bg-emerald-50/90 p-2.5 text-sm text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-3 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100 dark:shadow-none">
                  All recent records have acreage captured.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="liquid-reactive liquid-refraction surface-lift animate-liquid-rise rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.52),rgba(244,249,255,0.34))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:rounded-2xl dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(15,23,42,0.4))] dark:shadow-[0_12px_30px_rgba(2,6,23,0.25)]">
            <CardHeader className="p-3 pb-1 sm:p-5 sm:pb-2">
              <CardTitle className="text-base tracking-tight sm:text-lg">Next Best Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1.5 p-3 pt-1 sm:gap-2 sm:p-5 sm:pt-2">
              <Link
                href="/customers/new"
                className="press-physics liquid-refraction group flex items-center justify-between rounded-xl border border-white/70 bg-white/56 px-2.5 py-2.5 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all hover:bg-white/78 sm:px-3 sm:py-3 dark:border-white/20 dark:bg-white/8 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/14"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium sm:text-base">New customer</span>
                  <span className="truncate text-xs text-muted-foreground">Create account and field profile</span>
                </span>
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/equipment/new"
                className="press-physics liquid-refraction group flex items-center justify-between rounded-xl border border-white/70 bg-white/56 px-2.5 py-2.5 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all hover:bg-white/78 sm:px-3 sm:py-3 dark:border-white/20 dark:bg-white/8 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/14"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium sm:text-base">New equipment</span>
                  <span className="truncate text-xs text-muted-foreground">Register drone and spray setup</span>
                </span>
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/products/new"
                className="press-physics liquid-refraction group flex items-center justify-between rounded-xl border border-white/70 bg-white/56 px-2.5 py-2.5 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all hover:bg-white/78 sm:px-3 sm:py-3 dark:border-white/20 dark:bg-white/8 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/14"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium sm:text-base">New product</span>
                  <span className="truncate text-xs text-muted-foreground">Add herbicide and label details</span>
                </span>
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
