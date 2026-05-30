"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
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
  const [showDms, setShowDms] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const value = controlledValue ?? uncontrolledValue;
  const parsedValue = value.trim() === "" ? null : Number(value);
  const isValidParsedValue = parsedValue !== null && Number.isFinite(parsedValue);
  const normalizedValue = isValidParsedValue ? parsedValue : null;

  const dmsValue = useMemo(() => {
    if (!showDms || normalizedValue === null) {
      return null;
    }

    try {
      return dmsToString(decimalToDms(normalizedValue, axis));
    } catch {
      return null;
    }
  }, [axis, normalizedValue, showDms]);

  const displayError = error ?? clientError;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={name}>
          {label}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDms((current) => !current)}
        >
          {showDms ? "Hide DMS" : "Show DMS"}
        </Button>
      </div>

      <DecimalInput
        id={name}
        name={name}
        value={value}
        required={required}
        onChange={(event) => {
          if (controlledValue === undefined) {
            setUncontrolledValue(event.target.value);
          }
          onValueChange?.(event.target.value);
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

      {showDms ? (
        <p className="text-xs text-muted-foreground">DMS: {dmsValue ?? "—"}</p>
      ) : null}

      {displayError ? <p className="text-sm text-destructive">{displayError}</p> : null}
    </div>
  );
}
