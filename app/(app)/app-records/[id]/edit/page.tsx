import Link from "next/link";
import { notFound } from "next/navigation";

import { updateAppRecordAction } from "@/app/(app)/app-records/actions";
import { AppRecordForm } from "@/components/app-records/AppRecordForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type EditAppRecordPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAppRecordPage({ params }: EditAppRecordPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: record, error: recordError }, { data: pesticides, error: pesticidesError }] =
    await Promise.all([
      supabase.from("app_records").select("*").eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("app_record_pesticides")
        .select("id,sort_order,is_surfactant,epa_reg_number,product_name,active_ingredient")
        .eq("app_record_id", id)
        .order("sort_order", { ascending: true }),
    ]);

  if (recordError || !record) {
    notFound();
  }
  if (pesticidesError) {
    throw new Error("Unable to load record pesticides.");
  }

  const action = updateAppRecordAction.bind(null, record.id);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Application Record</h1>
          <Link href={`/app-records/${record.id}`} className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {record.job_date} / {record.customer_name}
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <AppRecordForm
            action={action}
            submitLabel="Save Application Record"
            pendingLabel="Saving..."
            defaultValues={{
              jobDate: record.job_date,
              applicatorName: record.applicator_name,
              customerName: record.customer_name,
              siteAddress: record.site_address,
              jobSiteId: record.job_site_id,
              locationLat: record.location_lat?.toString() ?? "",
              locationLng: record.location_lng?.toString() ?? "",
              tempF: record.temp_f?.toString() ?? "",
              windSpeedMph: record.wind_speed_mph?.toString() ?? "",
              windDirection:
                record.wind_direction === "N" ||
                record.wind_direction === "NE" ||
                record.wind_direction === "E" ||
                record.wind_direction === "SE" ||
                record.wind_direction === "S" ||
                record.wind_direction === "SW" ||
                record.wind_direction === "W" ||
                record.wind_direction === "NW"
                  ? record.wind_direction
                  : "",
              skyCondition:
                record.sky_condition === "clear" ||
                record.sky_condition === "partly_cloudy" ||
                record.sky_condition === "cloudy" ||
                record.sky_condition === "rain"
                  ? record.sky_condition
                  : "",
              targetVegetation: Array.isArray(record.target_vegetation)
                ? record.target_vegetation.filter((v: unknown): v is string => typeof v === "string")
                : [],
              targetVegOther: record.target_veg_other,
              appMethod:
                record.app_method === "backpack" ||
                record.app_method === "boom" ||
                record.app_method === "handgun" ||
                record.app_method === "utv" ||
                record.app_method === "truck_rig" ||
                record.app_method === "drone"
                  ? record.app_method
                  : "",
              startTime: record.start_time?.slice(0, 5) ?? "",
              endTime: record.end_time?.slice(0, 5) ?? "",
              totalGallons: record.total_gallons?.toString() ?? "",
              gallonsPerAcre: record.gallons_per_acre?.toString() ?? "",
              acresTreated: record.acres_treated?.toString() ?? "",
              tankMixRecord: record.tank_mix_record,
              equipmentNotes: record.equipment_notes,
              truckId: record.truck_id,
              nozzleType: record.nozzle_type,
              rei: record.rei,
              safeReentryDate: record.safe_reentry_date ?? "",
              additionalNotes: record.additional_notes,
              certAttested: record.cert_attested,
              applicatorSig: record.applicator_sig ?? "",
              licenseCertNo: record.license_cert_no,
              pesticides: (pesticides ?? []).map((row) => ({
                epaRegNumber: row.epa_reg_number,
                productName: row.product_name,
                activeIngredient: row.active_ingredient,
                isSurfactant: row.is_surfactant,
              })),
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
