import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RecordsMapClient, type RecordMapPoint } from "@/components/map/RecordsMapClient";
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
      <section className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Map View</h1>
          <p className="text-sm text-muted-foreground">View mix records on satellite map pins.</p>
        </header>
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
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
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Map View</h1>
        <p className="text-sm text-muted-foreground">View mix records on satellite map pins.</p>
      </header>

      <Card>
        <CardContent className="p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1">
              <label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                Date from
              </label>
              <Input id="dateFrom" name="dateFrom" type="date" defaultValue={filters.dateFrom ?? ""} />
            </div>
            <div className="grid gap-1">
              <label htmlFor="dateTo" className="text-xs text-muted-foreground">
                Date to
              </label>
              <Input id="dateTo" name="dateTo" type="date" defaultValue={filters.dateTo ?? ""} />
            </div>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      {points.length ? (
        <RecordsMapClient points={points} mapboxToken={mapboxToken} />
      ) : (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No records in this date range to map yet.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
