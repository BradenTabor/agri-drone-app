"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type GpsCaptureProps = {
  onCapture: (coords: { lat: number; lng: number }) => void;
};

export function GpsCapture({ onCapture }: GpsCaptureProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  async function captureCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("GPS is not available in this browser.");
      return;
    }

    setIsCapturing(true);
    setStatus("Capturing location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        onCapture({ lat, lng });
        setStatus(`Captured ${lat}, ${lng}`);
        setIsCapturing(false);
      },
      (error) => {
        setStatus(error.message || "Unable to capture location.");
        setIsCapturing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 12_000,
      },
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={captureCurrentLocation} disabled={isCapturing}>
        {isCapturing ? "Capturing..." : "Re-capture GPS"}
      </Button>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
