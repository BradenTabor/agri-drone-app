import Link from "next/link";

import { AppRecordsListClient } from "@/components/app-records/AppRecordsListClient";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AppRecordsPage() {
  const supabase = await createClient();
  const { data: records, error } = await supabase
    .from("app_records")
    .select("id,job_date,customer_name,job_site_id,applicator_name,acres_treated,app_method")
    .is("deleted_at", null)
    .order("job_date", { ascending: false });

  if (error) {
    throw new Error("Unable to load application records.");
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application Records</h1>
          <p className="text-sm text-muted-foreground">
            Commercial herbicide application records.
          </p>
        </div>
        <Link href="/app-records/new" className={buttonVariants()}>
          + New Application Record
        </Link>
      </header>

      <AppRecordsListClient records={records ?? []} />
    </section>
  );
}
