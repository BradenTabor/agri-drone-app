import Link from "next/link";
import { notFound } from "next/navigation";

import { updateMixRecordAction } from "@/app/(app)/records/actions";
import { MixRecordForm } from "@/components/forms/MixRecordForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type EditMixRecordPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMixRecordPage({ params }: EditMixRecordPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: record, error: recordError },
    { data: lines, error: linesError },
    { data: photos, error: photosError },
    { data: equipmentLinks, error: equipmentLinksError },
    { data: customers },
    { data: fields },
    { data: equipment },
    { data: products },
    { data: surfactants },
    { data: profiles },
  ] = await Promise.all([
    supabase.from("mix_records").select("*").eq("id", id).is("deleted_at", null).single(),
    supabase
      .from("mix_record_products")
      .select("id,product_id,amount_added,amount_unit,rate_per_acre,rate_unit,sort_order")
      .eq("mix_record_id", id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("mix_record_photos")
      .select("id,storage_path,uploaded_at")
      .eq("mix_record_id", id)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("mix_record_equipment")
      .select("equipment_id,sort_order")
      .eq("mix_record_id", id)
      .order("sort_order", { ascending: true }),
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
      .order("identifier", { ascending: true }),
    supabase
      .from("products")
      .select("id,name,epa_number,active")
      .is("deleted_at", null)
      .order("active", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("surfactants")
      .select("id,name,epa_number,default_unit,active")
      .is("deleted_at", null)
      .order("active", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id,full_name,email,license_cert_no")
      .is("deleted_at", null)
      .order("full_name", { ascending: true }),
  ]);

  if (recordError || !record) {
    notFound();
  }

  if (linesError) {
    throw new Error("Unable to load mix record product lines.");
  }
  if (photosError) {
    throw new Error("Unable to load mix record photos.");
  }
  if (equipmentLinksError) {
    throw new Error("Unable to load mix record equipment.");
  }

  const linkedEquipmentIds = (equipmentLinks ?? []).map((link) => link.equipment_id);
  const equipmentIds =
    linkedEquipmentIds.length > 0
      ? linkedEquipmentIds
      : record.equipment_id
        ? [record.equipment_id]
        : [];

  const photoEntries = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage.from("mix-record-photos").createSignedUrl(photo.storage_path, 60 * 60);
      return {
        id: photo.id,
        storagePath: photo.storage_path,
        previewUrl: data?.signedUrl ?? null,
      };
    }),
  );

  const action = updateMixRecordAction.bind(null, record.id);
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Mix Record</h1>
          <Link href={`/records/${record.id}`} className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {record.record_date} / {record.customer_name_snapshot || "Unknown customer"}
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
        <MixRecordForm
          action={action}
          submitLabel="Save Mix Record"
          pendingLabel="Saving..."
          defaultValues={{
            recordDate: record.record_date,
            timeMixed: record.time_mixed?.slice(0, 5) ?? "",
            applicatorId: record.applicator_id,
            applicatorNameOverride: record.applicator_name_override,
            licenseCertNo: record.license_cert_no,
            equipmentIds,
            customerId: record.customer_id,
            fieldId: record.field_id,
            mixLat: record.mix_lat?.toString() ?? "",
            mixLng: record.mix_lng?.toString() ?? "",
            tankSizeGal: record.tank_size_gal?.toString() ?? "",
            targetGpa: record.target_gpa?.toString() ?? "",
            waterGal: record.water_gal?.toString() ?? "",
            surfactantName: record.surfactant_name,
            surfactantAmount: record.surfactant_amount?.toString() ?? "",
            surfactantUnit: (record.surfactant_unit as "oz" | "fl_oz" | "gal" | "%" | "") ?? "",
            totalMixGal: record.total_mix_gal?.toString() ?? "",
            expectedAcres: record.expected_acres?.toString() ?? "",
            actualAcres: record.actual_acres?.toString() ?? "",
            notes: record.notes,
            signedTypedName: record.signed_typed_name,
            signatureAttested: record.signature_attested,
          }}
          defaultProductLines={(lines ?? []).map((line) => ({
            rowId: line.id,
            productId: line.product_id ?? "",
            amountAdded: line.amount_added.toString(),
            amountUnit: line.amount_unit as "gal" | "oz" | "fl_oz" | "lb",
            ratePerAcre: line.rate_per_acre?.toString() ?? "",
            rateUnit: (line.rate_unit as "" | "oz" | "fl_oz" | "gal" | "lb") ?? "",
          }))}
          existingPhotos={photoEntries}
          customers={(customers ?? []).map((customer) => ({ id: customer.id, name: customer.name }))}
          fields={(fields ?? []).map((field) => ({
            id: field.id,
            name: field.name,
            customerId: field.customer_id,
            defaultLat: field.default_lat,
            defaultLng: field.default_lng,
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
            fullName: profile.full_name,
            licenseCertNo: profile.license_cert_no,
          }))}
        />
        </CardContent>
      </Card>
    </section>
  );
}
