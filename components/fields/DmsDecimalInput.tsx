"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { decimalToDms, dmsToString } from "@/lib/formatting/coordinates";

type DmsDecimalInputProps = {
  name: string;
  label: string;
  axis: "lat" | "lng";
  defaultValue?: number | null;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string | null;
  required?: boolean;
};

const axisRange = {
  lat: { min: -90, max: 90, label: "Latitude" },
  lng: { min: -180, max: 180, label: "Longitude" },
} as const;

type DmsInputValue = {
  degrees: string;
  minutes: string;
  seconds: string;
  hemisphere: "N" | "S" | "E" | "W";
};

function hemispheresForAxis(axis: "lat" | "lng"): Array<"N" | "S" | "E" | "W"> {
  return axis === "lat" ? ["N", "S"] : ["E", "W"];
}

function toDmsInputValue(decimal: number, axis: "lat" | "lng"): DmsInputValue {
  const dms = decimalToDms(decimal, axis);
  return {
    degrees: String(dms.degrees),
    minutes: String(dms.minutes),
    seconds: dms.seconds.toFixed(2),
    hemisphere: dms.hemisphere,
  };
}

function parseDmsToDecimal(value: DmsInputValue, axis: "lat" | "lng"): { value: number | null; error: string | null } {
  const { degrees, minutes, seconds, hemisphere } = value;

  if (!degrees.trim() || !minutes.trim() || !seconds.trim()) {
    return { value: null, error: null };
  }

  const parsedDegrees = Number(degrees);
  const parsedMinutes = Number(minutes);
  const parsedSeconds = Number(seconds);
  const axisLabel = axisRange[axis].label;

  if (
    !Number.isFinite(parsedDegrees) ||
    !Number.isFinite(parsedMinutes) ||
    !Number.isFinite(parsedSeconds)
  ) {
    return { value: null, error: `${axisLabel} DMS values must be numbers.` };
  }

  if (!Number.isInteger(parsedDegrees) || parsedDegrees < 0 || parsedDegrees > Math.abs(axisRange[axis].max)) {
    return { value: null, error: `${axisLabel} degrees must be an integer between 0 and ${Math.abs(axisRange[axis].max)}.` };
  }

  if (!Number.isInteger(parsedMinutes) || parsedMinutes < 0 || parsedMinutes > 59) {
    return { value: null, error: `${axisLabel} minutes must be an integer between 0 and 59.` };
  }

  if (parsedSeconds < 0 || parsedSeconds >= 60) {
    return { value: null, error: `${axisLabel} seconds must be between 0 and 59.99.` };
  }

  const allowedHemispheres = hemispheresForAxis(axis);
  if (!allowedHemispheres.includes(hemisphere)) {
    return {
      value: null,
      error: `${axisLabel} hemisphere must be ${allowedHemispheres.join(" or ")}.`,
    };
  }

  const decimal = parsedDegrees + parsedMinutes / 60 + parsedSeconds / 3600;
  const signed = hemisphere === "S" || hemisphere === "W" ? -decimal : decimal;
  if (signed < axisRange[axis].min || signed > axisRange[axis].max) {
    return { value: null, error: `${axisLabel} must be between ${axisRange[axis].min} and ${axisRange[axis].max}.` };
  }

  return { value: Number(signed.toFixed(6)), error: null };
}

function validateDecimalValue(rawValue: string, axis: "lat" | "lng"): string | null {
  const value = rawValue.trim();
  if (value.length === 0) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return `${axisRange[axis].label} must be a number.`;
  }

  if (parsed < axisRange[axis].min || parsed > axisRange[axis].max) {
    return `${axisRange[axis].label} must be between ${axisRange[axis].min} and ${axisRange[axis].max}.`;
  }

  return null;
}

export function DmsDecimalInput({
  name,
  label,
  axis,
  defaultValue,
  value: controlledValue,
  onValueChange,
  error,
  required = false,
}: DmsDecimalInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue?.toString() ?? "");
  const [inputMode, setInputMode] = useState<"decimal" | "dms">("decimal");
  const [clientError, setClientError] = useState<string | null>(null);

  const value = controlledValue ?? uncontrolledValue;
  const parsedValue = value.trim() === "" ? null : Number(value);
  const isValidParsedValue = parsedValue !== null && Number.isFinite(parsedValue);
  const normalizedValue = isValidParsedValue ? parsedValue : null;

  const dmsValue = useMemo(() => {
    if (normalizedValue === null) {
      return null;
    }

    try {
      return dmsToString(decimalToDms(normalizedValue, axis));
    } catch {
      return null;
    }
  }, [axis, normalizedValue]);

  const [dmsInput, setDmsInput] = useState<DmsInputValue>(() =>
    normalizedValue === null
      ? {
          degrees: "",
          minutes: "",
          seconds: "",
          hemisphere: axis === "lat" ? "N" : "E",
        }
      : toDmsInputValue(normalizedValue, axis),
  );

  useEffect(() => {
    if (normalizedValue === null) return;
    setDmsInput(toDmsInputValue(normalizedValue, axis));
  }, [axis, normalizedValue]);

  const displayError = error ?? clientError;
  const isDmsMode = inputMode === "dms";

  function writeValue(nextValue: string) {
    if (controlledValue === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={name}>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setInputMode((current) => (current === "decimal" ? "dms" : "decimal"));
            setClientError(null);
          }}
        >
          {isDmsMode ? "Use Decimal" : "Use DMS"}
        </Button>
      </div>

      {isDmsMode ? (
        <>
          <input type="hidden" name={name} value={value} />
          <div className="grid grid-cols-4 gap-2">
            <Input
              placeholder="Deg"
              inputMode="numeric"
              value={dmsInput.degrees}
              onChange={(event) => {
                const next = { ...dmsInput, degrees: event.target.value };
                setDmsInput(next);
                const parsed = parseDmsToDecimal(next, axis);
                if (parsed.error) {
                  setClientError(parsed.error);
                  return;
                }
                if (parsed.value === null) {
                  setClientError(null);
                  writeValue("");
                  return;
                }
                setClientError(null);
                writeValue(String(parsed.value));
              }}
              className={cn(displayError ? "border-destructive" : "")}
            />
            <Input
              placeholder="Min"
              inputMode="numeric"
              value={dmsInput.minutes}
              onChange={(event) => {
                const next = { ...dmsInput, minutes: event.target.value };
                setDmsInput(next);
                const parsed = parseDmsToDecimal(next, axis);
                if (parsed.error) {
                  setClientError(parsed.error);
                  return;
                }
                if (parsed.value === null) {
                  setClientError(null);
                  writeValue("");
                  return;
                }
                setClientError(null);
                writeValue(String(parsed.value));
              }}
              className={cn(displayError ? "border-destructive" : "")}
            />
            <Input
              placeholder="Sec"
              inputMode="decimal"
              value={dmsInput.seconds}
              onChange={(event) => {
                const next = { ...dmsInput, seconds: event.target.value };
                setDmsInput(next);
                const parsed = parseDmsToDecimal(next, axis);
                if (parsed.error) {
                  setClientError(parsed.error);
                  return;
                }
                if (parsed.value === null) {
                  setClientError(null);
                  writeValue("");
                  return;
                }
                setClientError(null);
                writeValue(String(parsed.value));
              }}
              className={cn(displayError ? "border-destructive" : "")}
            />
            <Input
              placeholder="Hem"
              value={dmsInput.hemisphere}
              onChange={(event) => {
                const raw = event.target.value.toUpperCase();
                const hem = raw.slice(0, 1) as "N" | "S" | "E" | "W";
                const next = { ...dmsInput, hemisphere: hem };
                setDmsInput(next);
                const parsed = parseDmsToDecimal(next, axis);
                if (parsed.error) {
                  setClientError(parsed.error);
                  return;
                }
                if (parsed.value === null) {
                  setClientError(null);
                  writeValue("");
                  return;
                }
                setClientError(null);
                writeValue(String(parsed.value));
              }}
              className={cn(displayError ? "border-destructive" : "")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter DMS as degrees, minutes, seconds, and hemisphere ({axis === "lat" ? "N/S" : "E/W"}).
          </p>
        </>
      ) : null}
      {!isDmsMode ? (
        <>
          <DecimalInput
            id={name}
            name={name}
            value={value}
            required={required}
            onChange={(event) => {
              writeValue(event.target.value);
              if (clientError) {
                setClientError(null);
              }
            }}
            onBlur={(event) => {
              setClientError(validateDecimalValue(event.target.value, axis));
            }}
            aria-invalid={Boolean(displayError)}
            className={cn(displayError ? "border-destructive" : "")}
          />
          <p className="text-xs text-muted-foreground">DMS: {dmsValue ?? "—"}</p>
        </>
      ) : null}

      {displayError ? <p className="text-sm text-destructive">{displayError}</p> : null}
    </div>
  );
}
