export type Hemisphere = "N" | "S" | "E" | "W";

export type DmsCoordinate = {
  degrees: number;
  minutes: number;
  seconds: number;
  hemisphere: Hemisphere;
};

function normalizeDmsParts(totalDegrees: number) {
  const abs = Math.abs(totalDegrees);
  let degrees = Math.floor(abs);
  const minutesFull = (abs - degrees) * 60;
  let minutes = Math.floor(minutesFull);
  let seconds = Number(((minutesFull - minutes) * 60).toFixed(2));

  if (seconds >= 60) {
    seconds = 0;
    minutes += 1;
  }

  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }

  return { degrees, minutes, seconds };
}

export function decimalToDms(decimal: number, axis: "lat" | "lng"): DmsCoordinate {
  if (!Number.isFinite(decimal)) {
    throw new Error("Coordinate must be a finite number.");
  }

  if (axis === "lat" && (decimal < -90 || decimal > 90)) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (axis === "lng" && (decimal < -180 || decimal > 180)) {
    throw new Error("Longitude must be between -180 and 180.");
  }

  const hemisphere: Hemisphere =
    axis === "lat" ? (decimal < 0 ? "S" : "N") : decimal < 0 ? "W" : "E";

  return {
    ...normalizeDmsParts(decimal),
    hemisphere,
  };
}

export function dmsToString(dms: DmsCoordinate): string {
  const seconds = dms.seconds.toFixed(2);
  return `${dms.degrees}° ${dms.minutes}' ${seconds}" ${dms.hemisphere}`;
}
