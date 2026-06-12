"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Map, { MapRef, Marker, NavigationControl, Popup } from "react-map-gl/mapbox";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RecordMapPoint = {
  id: string;
  record_date: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  mix_lat: number;
  mix_lng: number;
};

type RecordsMapClientProps = {
  points: RecordMapPoint[];
  mapboxToken: string;
};

function getBounds(points: RecordMapPoint[]) {
  let minLat = points[0].mix_lat;
  let maxLat = points[0].mix_lat;
  let minLng = points[0].mix_lng;
  let maxLng = points[0].mix_lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.mix_lat);
    maxLat = Math.max(maxLat, point.mix_lat);
    minLng = Math.min(minLng, point.mix_lng);
    maxLng = Math.max(maxLng, point.mix_lng);
  }

  return {
    sw: [minLng, minLat] as [number, number],
    ne: [maxLng, maxLat] as [number, number],
  };
}

export function RecordsMapClient({ points, mapboxToken }: RecordsMapClientProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const initialViewState =
    points.length === 1
      ? { latitude: points[0].mix_lat, longitude: points[0].mix_lng, zoom: 13 }
      : { latitude: 34.7465, longitude: -92.2896, zoom: 7 };

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedId) ?? null,
    [points, selectedId],
  );

  useEffect(() => {
    if (!points.length || !mapRef.current) {
      return;
    }

    const map = mapRef.current;

    if (points.length === 1) return;

    const bounds = getBounds(points);
    map.fitBounds([bounds.sw, bounds.ne], {
      padding: 80,
      duration: 700,
      maxZoom: 14,
    });
  }, [points]);

  return (
    <div className="h-[min(52vh,420px)] min-h-[280px] w-full overflow-hidden rounded-xl border sm:h-[70vh] sm:min-h-[460px] sm:rounded-lg">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        reuseMaps
      >
        <NavigationControl position="top-right" />

        {points.map((point) => (
          <Marker key={point.id} latitude={point.mix_lat} longitude={point.mix_lng} anchor="bottom">
            <button
              type="button"
              aria-label={`Open record ${point.id}`}
              className={cn(
                "h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md",
                selectedId === point.id && "h-5 w-5",
              )}
              onClick={() => setSelectedId(point.id)}
            />
          </Marker>
        ))}

        {selectedPoint ? (
          <Popup
            latitude={selectedPoint.mix_lat}
            longitude={selectedPoint.mix_lng}
            anchor="top"
            closeOnClick={false}
            onClose={() => setSelectedId(null)}
            offset={16}
          >
            <div className="space-y-1 text-sm">
              <p className="font-medium">{selectedPoint.record_date}</p>
              <p className="text-muted-foreground">{selectedPoint.customer_name_snapshot ?? "—"}</p>
              <p className="text-muted-foreground">{selectedPoint.field_name_snapshot ?? "—"}</p>
              <Link
                href={`/records/${selectedPoint.id}`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                View record
              </Link>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
