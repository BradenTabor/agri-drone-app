import { MapDateFilterPanel } from "@/components/map/MapDateFilterPanel";
import { RecordsMapClient, type RecordMapPoint } from "@/components/map/RecordsMapClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type MapPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function MapPage({ searchParams }: MapPageProps) {
  const filters = await searchParams;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();

  if (!mapboxToken) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <PageHeader title="Map View" description="View mix records on satellite map pins." />
        <Card className="rounded-xl sm:rounded-2xl">
          <CardContent className="p-3 text-sm text-muted-foreground sm:p-5">
            Missing `NEXT_PUBLIC_MAPBOX_TOKEN`. Add it to `.env.local` and restart `next dev` to enable the
            map.
          </CardContent>
        </Card>
      </section>
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("mix_records")
    .select("id,record_date,customer_name_snapshot,field_name_snapshot,mix_lat,mix_lng")
    .is("deleted_at", null)
    .order("record_date", { ascending: false })
    .order("submitted_at", { ascending: false });

  if (filters.dateFrom) {
    query = query.gte("record_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("record_date", filters.dateTo);
  }

  const { data: rows, error } = await query;

  if (error) {
    throw new Error("Unable to load map records.");
  }

  const points = (rows ?? []) as RecordMapPoint[];

  return (
    <section className="space-y-3 sm:space-y-4">
      <PageHeader title="Map View" description="View mix records on satellite map pins." />

      <MapDateFilterPanel
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        pointCount={points.length}
      />

      {points.length ? (
        <RecordsMapClient points={points} mapboxToken={mapboxToken} />
      ) : (
        <Card className="rounded-xl sm:rounded-2xl">
          <CardContent className="p-3 text-sm text-muted-foreground sm:p-5">
            No records in this date range to map yet.
          </CardContent>
        </Card>
      )}

    </section>
  );
}
