import Link from "next/link";
import { notFound } from "next/navigation";

import { softDeleteMixRecordAction } from "@/app/(app)/records/actions";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { PdfDownloadButton } from "@/components/shared/PdfDownloadButton";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type RecordDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: record, error: recordError }, { data: productLines, error: productLinesError }, { data: photos, error: photosError }] =
    await Promise.all([
      supabase.from("mix_records").select("*").eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("mix_record_products")
        .select("id,amount_added,amount_unit,rate_per_acre,rate_unit,sort_order,products(name,epa_number)")
        .eq("mix_record_id", id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("mix_record_photos")
        .select("id,storage_path,uploaded_at")
        .eq("mix_record_id", id)
        .is("deleted_at", null)
        .order("uploaded_at", { ascending: false }),
    ]);

  if (recordError || !record) {
    notFound();
  }

  if (productLinesError) {
    throw new Error("Unable to load product lines.");
  }
  if (photosError) {
    throw new Error("Unable to load record photos.");
  }

  const { data: applicatorProfile, error: applicatorProfileError } = record.applicator_id
    ? await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", record.applicator_id)
        .maybeSingle()
    : { data: null, error: null };
  if (applicatorProfileError) {
    throw new Error("Unable to load applicator profile.");
  }
  const { data: equipmentRecord, error: equipmentError } = record.equipment_id
    ? await supabase
        .from("equipment")
        .select("identifier")
        .eq("id", record.equipment_id)
        .maybeSingle()
    : { data: null, error: null };
  if (equipmentError) {
    throw new Error("Unable to load equipment record.");
  }

  const profileApplicatorLabel =
    applicatorProfile?.full_name || applicatorProfile?.email || record.applicator_id || null;
  const applicatorDisplay =
    record.applicator_name_override ||
    profileApplicatorLabel ||
    "—";
  const equipmentDisplay = equipmentRecord?.identifier || record.equipment_id || "—";

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

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mix Record {record.record_date}
          </h1>
          <p className="text-sm text-muted-foreground">
            {record.customer_name_snapshot || "Unknown customer"} / {record.field_name_snapshot || "Unknown field"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/records" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
          <PdfDownloadButton
            pdfUrl={`/api/pdf/${record.id}`}
            filename={`mix-record-${record.record_date}-${record.id.slice(0, 8)}.pdf`}
          />
          <Link href={`/records/${record.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit
          </Link>
          <form action={softDeleteMixRecordAction.bind(null, record.id)}>
            <ConfirmSubmitButton
              variant="destructive"
              confirmMessage={`Delete mix record from ${record.record_date}?`}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </header>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Header & Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 text-sm md:grid-cols-3">
          <Detail label="Date">{record.record_date}</Detail>
          <Detail label="Time mixed">{record.time_mixed}</Detail>
          <Detail label="Applicator">{applicatorDisplay}</Detail>
          <Detail label="Equipment">{equipmentDisplay}</Detail>
          <Detail label="License #">{record.license_cert_no || "—"}</Detail>
          <Detail label="GPS">
            {record.mix_lat}, {record.mix_lng}
          </Detail>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Mix details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5 text-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Detail label="Tank size">{record.tank_size_gal} gal</Detail>
            <Detail label="Target GPA">{record.target_gpa}</Detail>
            <Detail label="Water">{record.water_gal} gal</Detail>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Products</h3>
            {!productLines?.length ? (
              <p className="text-muted-foreground">No product lines.</p>
            ) : (
              <ul className="space-y-2">
                {productLines.map((line) => (
                  <li key={line.id}>
                    <Card>
                      <CardContent className="p-3">
                        <div className="font-medium">
                          {line.products?.name || "Unlinked product"}
                        </div>
                        <div className="text-muted-foreground">
                          {line.amount_added} {line.amount_unit}
                          {line.rate_per_acre !== null && line.rate_unit
                            ? ` · ${line.rate_per_acre} ${line.rate_unit}/ac`
                            : ""}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Detail label="Surfactant">
              {record.surfactant_name
                ? `${record.surfactant_name} (${record.surfactant_amount ?? "—"} ${record.surfactant_unit ?? ""})`
                : "—"}
            </Detail>
            <Detail label="Total mix">{record.total_mix_gal} gal</Detail>
            <Detail label="Expected acres">{record.expected_acres}</Detail>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Conditions & Sign-off</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 text-sm md:grid-cols-3">
          <Detail label="Wind">
            {record.wind_speed_mph} mph {record.wind_direction}
          </Detail>
          <Detail label="Temp / Humidity">
            {record.temp_f ?? "—"} F / {record.humidity_pct ?? "—"}%
          </Detail>
          <Detail label="Photos">{photoEntries.length}</Detail>
          <Detail label="Typed signature">{record.signed_typed_name}</Detail>
          <Detail label="Attested">{record.signature_attested ? "Yes" : "No"}</Detail>
          <Detail label="Last modified">
            {record.last_modified_at || record.submitted_at}
          </Detail>
          <Detail label="Notes" className="md:col-span-3">
            {record.notes || "—"}
          </Detail>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {!photoEntries.length ? (
            <p className="text-sm text-muted-foreground">No photos attached.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {photoEntries.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <a
                    href={photo.previewUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {photo.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.previewUrl}
                        alt="Mix record photo"
                        className="mb-2 h-32 w-full rounded object-cover"
                      />
                    ) : (
                      <div className="mb-2 flex h-32 items-center justify-center rounded bg-muted">
                        Preview unavailable
                      </div>
                    )}
                    <p className="break-all">{photo.storagePath}</p>
                  </a>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{children}</p>
    </div>
  );
}
