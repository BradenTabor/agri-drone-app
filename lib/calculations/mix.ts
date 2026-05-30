export type MixProductLineForCalc = {
  amountAdded: number;
  amountUnit: "gal" | "oz" | "fl_oz" | "lb";
};

export function calculateExpectedAcres(args: {
  tankSizeGal: number;
  targetGpa: number;
}): number | null {
  const { tankSizeGal, targetGpa } = args;
  if (!Number.isFinite(tankSizeGal) || !Number.isFinite(targetGpa) || targetGpa <= 0) {
    return null;
  }
  return Number((tankSizeGal / targetGpa).toFixed(2));
}

export function calculateTotalMixGallonsHint(args: {
  waterGal: number;
  productLines: MixProductLineForCalc[];
  surfactantAmount: number | null;
  surfactantUnit: "oz" | "fl_oz" | "gal" | "%" | null;
}): number | null {
  const { waterGal, productLines, surfactantAmount, surfactantUnit } = args;
  if (!Number.isFinite(waterGal)) {
    return null;
  }

  const nonGallonProductExists = productLines.some((line) => line.amountUnit !== "gal");
  if (nonGallonProductExists) {
    return null;
  }

  if (surfactantAmount !== null && surfactantUnit !== null && surfactantUnit !== "gal") {
    return null;
  }

  const productTotal = productLines.reduce((sum, line) => sum + line.amountAdded, 0);
  const surfactantTotal = surfactantUnit === "gal" && surfactantAmount !== null ? surfactantAmount : 0;
  return Number((waterGal + productTotal + surfactantTotal).toFixed(2));
}
