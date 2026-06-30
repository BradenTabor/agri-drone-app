import Link from "next/link";
import { notFound } from "next/navigation";

import { softDeleteAppRecordAction } from "@/app/(app)/app-records/actions";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { PdfDownloadButton } from "@/components/shared/PdfDownloadButton";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type AppRecordDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatMethod(value: string | null): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAppType(value: string | null): string {
  if (!value) return "—";
  return value[0]?.toUpperCase() + value.slice(1);
}

export default async function AppRecordDetailPage({ params }: AppRecordDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: record, error: recordError }, { data: pesticides, error: pesticidesError }, { data: mixLinks, error: mixLinksError }] =
    await Promise.all([
      supabase.from("app_records").select("*").eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("app_record_pesticides")
        .select("id,sort_order,is_surfactant,epa_reg_number,product_name,active_ingredient")
        .eq("app_record_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("app_record_mix_records")
        .select(
          `
          mix_record_id,
          sort_order,
          mix_records(record_date, customer_name_snapshot, field_name_snapshot, deleted_at)
        `,
        )
        .eq("app_record_id", id)
        .order("sort_order", { ascending: true }),
    ]);

  if (recordError || !record) {
    notFound();
  }
  if (pesticidesError) {
    throw new Error("Unable to load record pesticides.");
  }
  if (mixLinksError) {
    throw new Error("Unable to load linked mix records.");
  }

  const linkedMixRecords = (mixLinks ?? [])
    .map((link) => {
      const mix = Array.isArray(link.mix_records) ? link.mix_records[0] : link.mix_records;
      if (!mix || mix.deleted_at) return null;
      return {
        mixRecordId: link.mix_record_id,
        recordDate: mix.record_date,
        customerName: mix.customer_name_snapshot,
        fieldName: mix.field_name_snapshot,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  const targetVegetation = Array.isArray(record.target_vegetation)
    ? record.target_vegetation.filter((v: unknown): v is string => typeof v === "string")
    : [];

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Application Record</h1>
          <p className="text-sm text-muted-foreground">
            {record.job_date} / {record.customer_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/app-records" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
          <Link
            href={`/quotes/new?fromRecord=${record.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Generate Quote
          </Link>
          <PdfDownloadButton
            pdfUrl={`/api/app-record-pdf/${record.id}`}
            filename={`application-record-${record.job_date}-${record.id.slice(0, 8)}.pdf`}
            shareTitle={`Application Record — ${record.job_date}`}
          />
          <Link href={`/app-records/${record.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit
          </Link>
          <form action={softDeleteAppRecordAction.bind(null, record.id)}>
            <ConfirmSubmitButton
              variant="destructive"
              confirmMessage={`Delete application record from ${record.job_date}?`}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </header>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>COMMERCIAL HERBICIDE APPLICATION RECORD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-5 text-sm">
          <p>(Required by State &amp; Federal Law - Retain 3 Years)</p>
          <p>Aerial Technology Solutions LLC | License #57275</p>
          <p>11347 NC 3700, Western Grove, AR 72685</p>
          <p>(870)704-0379 | aerialtechnologysolutions@gmail.com</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Job Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 text-sm md:grid-cols-3">
          <Detail label="Job date">{record.job_date}</Detail>
          <Detail label="Applicator">{record.applicator_name}</Detail>
          <Detail label="Customer">{record.customer_name}</Detail>
          <Detail label="Site address">{record.site_address || "—"}</Detail>
          <Detail label="Job/Site ID">{record.job_site_id || "—"}</Detail>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>GPS & Weather</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 text-sm md:grid-cols-3">
          <Detail label="Latitude">{record.location_lat ?? "—"}</Detail>
          <Detail label="Longitude">{record.location_lng ?? "—"}</Detail>
          <Detail label="Temp (F)">{record.temp_f ?? "—"}</Detail>
          <Detail label="Wind speed (mph)">{record.wind_speed_mph ?? "—"}</Detail>
          <Detail label="Wind direction">{record.wind_direction ?? "—"}</Detail>
          <Detail label="Sky condition">{record.sky_condition ?? "—"}</Detail>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Application</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 text-sm md:grid-cols-3">
          <Detail label="Target vegetation">{targetVegetation.join(", ") || "—"}</Detail>
          <Detail label="Other vegetation">{record.target_veg_other || "—"}</Detail>
          <Detail label="Method">{formatMethod(record.app_method)}</Detail>
          <Detail label="Application type">{formatAppType(record.app_type)}</Detail>
          <Detail label="Start time">{record.start_time ?? "—"}</Detail>
          <Detail label="End time">{record.end_time ?? "—"}</Detail>
        </CardContent>
      </Card>

      {linkedMixRecords.length > 0 ? (
        <Card>
          <CardHeader className="p-5 pb-0">
            <CardTitle>Mix Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-5 text-sm">
            {linkedMixRecords.map((mix) => (
              <Link
                key={mix.mixRecordId}
                href={`/records/${mix.mixRecordId}`}
                className="block rounded-md border px-3 py-2 hover:bg-muted/50"
              >
                {mix.recordDate} · {mix.customerName ?? "—"} — {mix.fieldName ?? "—"}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Pesticides</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">EPA Reg #</th>
                  <th className="px-4 py-3 font-medium">Product Name</th>
                  <th className="px-4 py-3 font-medium">Active Ingredient</th>
                </tr>
              </thead>
              <tbody>
                {(pesticides ?? []).map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-4 py-3">{line.is_surfactant ? "Surfactant/Adjuvant" : "Product"}</td>
                    <td className="px-4 py-3">{line.epa_reg_number || "—"}</td>
                    <td className="px-4 py-3">{line.product_name}</td>
                    <td className="px-4 py-3">{line.active_ingredient || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Totals, Equipment, and Certification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 text-sm md:grid-cols-3">
          <Detail label="Total gallons">{record.total_gallons ?? "—"}</Detail>
          <Detail label="Gallons per acre">{record.gallons_per_acre ?? "—"}</Detail>
          <Detail label="Acres treated">{record.acres_treated ?? "—"}</Detail>
          <Detail label="Tank mix record">{record.tank_mix_record || "—"}</Detail>
          <Detail label="Equipment notes">{record.equipment_notes || "—"}</Detail>
          <Detail label="Truck ID">{record.truck_id || "—"}</Detail>
          <Detail label="Nozzle type">{record.nozzle_type || "—"}</Detail>
          <Detail label="REI">{record.rei || "—"}</Detail>
          <Detail label="Safe re-entry date">{record.safe_reentry_date || "—"}</Detail>
          <Detail label="Additional notes">{record.additional_notes || "—"}</Detail>
          <Detail label="Attested">{record.cert_attested ? "Yes" : "No"}</Detail>
          <Detail label="Applicator signature">{record.applicator_sig || "—"}</Detail>
          <Detail label="License / cert #">{record.license_cert_no || "—"}</Detail>
        </CardContent>
      </Card>
    </section>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{children}</p>
    </div>
  );
}
