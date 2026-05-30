export type RateGuardrailResult =
  | { status: "ok" }
  | { status: "below_min"; min: number; unit: string }
  | { status: "above_max"; max: number; unit: string }
  | { status: "no_guardrails" };

export function checkRateAgainstLabel(args: {
  enteredRate: number;
  enteredUnit: string;
  labelMinRate: number | null;
  labelMaxRate: number | null;
  labelUnit: string | null;
}): RateGuardrailResult {
  const { enteredRate, enteredUnit, labelMinRate, labelMaxRate, labelUnit } = args;

  // V1 compares rates only when units already match.
  if (!labelUnit || labelUnit !== enteredUnit) {
    return { status: "no_guardrails" };
  }

  if (labelMinRate !== null && enteredRate < labelMinRate) {
    return { status: "below_min", min: labelMinRate, unit: labelUnit };
  }

  if (labelMaxRate !== null && enteredRate > labelMaxRate) {
    return { status: "above_max", max: labelMaxRate, unit: labelUnit };
  }

  return { status: "ok" };
}
