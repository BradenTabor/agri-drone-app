import Link from "next/link";

import { AppRecordsListClient } from "@/components/app-records/AppRecordsListClient";
import { FormDraftResumeBanner } from "@/components/forms/FormDraftResumeBanner";
import { PageHeader } from "@/components/shared/PageHeader";
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
    <section className="space-y-3 sm:space-y-4">
      <PageHeader
        title="Application Records"
        description="Commercial herbicide application records."
        action={
          <Link href="/app-records/new" className={buttonVariants()}>
            + New Application Record
          </Link>
        }
      />

      <FormDraftResumeBanner formType="app-record" href="/app-records/new" label="application record" />

      <AppRecordsListClient records={records ?? []} />
    </section>
  );
}
