import Link from "next/link";

import { createMixRecordAction } from "@/app/(app)/records/actions";
import { MixRecordForm } from "@/components/forms/MixRecordForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function NewMixRecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: customers }, { data: fields }, { data: equipment }, { data: products }, { data: surfactants }, { data: profiles }, { data: selfProfile }] =
    await Promise.all([
      supabase.from("customers").select("id,name").is("deleted_at", null).order("name", { ascending: true }),
      supabase
        .from("fields")
        .select("id,name,customer_id")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("equipment")
        .select("id,identifier")
        .is("deleted_at", null)
        .eq("active", true)
        .order("identifier", { ascending: true }),
      supabase
        .from("products")
        .select("id,name,epa_number,active")
        .is("deleted_at", null)
        .eq("active", true)
        .order("name", { ascending: true }),
      supabase
        .from("surfactants")
        .select("id,name,epa_number,default_unit,active")
        .is("deleted_at", null)
        .eq("active", true)
        .order("name", { ascending: true }),
      supabase
        .from("profiles")
        .select("id,full_name,email")
        .is("deleted_at", null)
        .order("full_name", { ascending: true }),
      user
        ? supabase.from("profiles").select("id,license_cert_no").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">New Mix Record</h1>
          <Link href="/records" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Capture a complete mix record with products, conditions, and signature.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
        <MixRecordForm
          action={createMixRecordAction}
          submitLabel="Create Mix Record"
          pendingLabel="Creating..."
          defaultValues={{
            applicatorId: user?.id ?? null,
            licenseCertNo: selfProfile?.license_cert_no ?? null,
            windDirection: "N",
          }}
          customers={(customers ?? []).map((customer) => ({ id: customer.id, name: customer.name }))}
          fields={(fields ?? []).map((field) => ({
            id: field.id,
            name: field.name,
            customerId: field.customer_id,
          }))}
          equipment={(equipment ?? []).map((item) => ({ id: item.id, identifier: item.identifier }))}
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
            defaultUnit: surfactant.default_unit as "oz" | "fl_oz" | "gal" | "%" | null,
            active: surfactant.active,
          }))}
          applicators={(profiles ?? []).map((profile) => ({
            id: profile.id,
            label: profile.full_name || profile.email || profile.id,
          }))}
        />
        </CardContent>
      </Card>
    </section>
  );
}
