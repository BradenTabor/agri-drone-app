import { DashboardPageContent } from "@/components/dashboard/DashboardPageContent";
import type { DashboardRecentRecord } from "@/components/dashboard/dashboard-tokens";
import { createClient } from "@/lib/supabase/server";

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

  const records = (recentRecords ?? []) as DashboardRecentRecord[];

  return (
    <DashboardPageContent
      todayIso={todayIso}
      records={records}
      mixToday={mixTodayCount ?? 0}
      appToday={appTodayCount ?? 0}
      openAcreageChecks={pendingAcreageCount ?? 0}
      activeCustomers={customersCount ?? 0}
    />
  );
}
