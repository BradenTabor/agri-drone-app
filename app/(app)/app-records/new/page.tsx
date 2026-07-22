import Link from "next/link";

import { createAppRecordAction } from "@/app/(app)/app-records/actions";
import { AppRecordForm } from "@/components/app-records/AppRecordForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildFormDraftKey } from "@/lib/formDrafts/types";
import { createClient } from "@/lib/supabase/server";

export default async function NewAppRecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: selfProfile },
    { data: products },
    { data: surfactants },
    { data: customers },
    { data: fields },
    { data: equipment },
  ] = await Promise.all([
    user
      ? supabase.from("profiles").select("full_name,license_cert_no").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("products")
      .select("id,name,epa_number,active")
      .is("deleted_at", null)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("surfactants")
      .select("id,name,epa_number,active")
      .is("deleted_at", null)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase.from("customers").select("id,name").is("deleted_at", null).order("name", { ascending: true }),
    supabase
      .from("fields")
      .select("id,name,customer_id,default_lat,default_lng")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("equipment")
      .select("id,identifier")
      .is("deleted_at", null)
      .eq("active", true)
      .order("identifier", { ascending: true }),
  ]);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">New Application Record</h1>
          <Link href="/app-records" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Capture a commercial herbicide application record.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <AppRecordForm
            action={createAppRecordAction}
            draftKey={user ? buildFormDraftKey("app-record", user.id) : null}
            currentAppRecordId={null}
            products={(products ?? []).map((product) => ({
              id: product.id,
              name: product.name,
              epaNumber: product.epa_number,
              active: product.active,
            }))}
            surfactants={(surfactants ?? []).map((surfactant) => ({
              id: surfactant.id,
              name: surfactant.name,
              epaNumber: surfactant.epa_number,
              active: surfactant.active,
            }))}
            customers={(customers ?? []).map((customer) => ({
              id: customer.id,
              name: customer.name,
            }))}
            fields={(fields ?? []).map((field) => ({
              id: field.id,
              name: field.name,
              customerId: field.customer_id,
              defaultLat: field.default_lat,
              defaultLng: field.default_lng,
            }))}
            equipment={(equipment ?? []).map((item) => ({
              id: item.id,
              identifier: item.identifier,
            }))}
            defaultValues={{
              applicatorName: selfProfile?.full_name ?? "",
              licenseCertNo: selfProfile?.license_cert_no ?? "",
              applicatorSig: selfProfile?.full_name ?? "",
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
