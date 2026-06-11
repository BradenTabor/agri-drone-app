"use client";

import { useActionState, useMemo, useState } from "react";

import type { ProductFormState } from "@/app/(app)/products/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DecimalInput } from "@/components/ui/decimal-input";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: ProductFormState = { error: null };

type IngredientRow = {
  rowId: string;
  name: string;
};

type ProductFormValues = {
  name: string;
  manufacturer: string | null;
  epaNumber: string | null;
  unitCost: number | null;
  retailCost: number | null;
  costUnit: "gal" | "oz" | "fl_oz" | "lb" | null;
  restrictedUse: boolean;
  active: boolean;
  ingredients: string[];
  notes: string | null;
};

type ProductFormProps = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues?: ProductFormValues;
};

function newIngredientRow(name = ""): IngredientRow {
  return { rowId: crypto.randomUUID(), name };
}

function errorFor(state: ProductFormState, field: keyof ProductFormValues) {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

function formatCost(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseCostInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function costUnitLabel(unit: ProductFormValues["costUnit"]) {
  switch (unit) {
    case "gal":
      return "per gal";
    case "oz":
      return "per oz";
    case "fl_oz":
      return "per fl oz";
    case "lb":
      return "per lb";
    default:
      return "per unit";
  }
}

function calculatePricingMargin(wholesale: number | null, retail: number | null) {
  if (wholesale === null || retail === null) {
    return null;
  }

  const difference = retail - wholesale;
  const markupPercent = wholesale > 0 ? (difference / wholesale) * 100 : null;

  return { difference, markupPercent };
}

export function ProductForm({
  action,
  submitLabel,
  pendingLabel,
  defaultValues,
}: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() =>
    defaultValues?.ingredients.length
      ? defaultValues.ingredients.map((name) => newIngredientRow(name))
      : [],
  );
  const [wholesaleCost, setWholesaleCost] = useState(
    defaultValues?.unitCost != null ? String(defaultValues.unitCost) : "",
  );
  const [retailCost, setRetailCost] = useState(
    defaultValues?.retailCost != null ? String(defaultValues.retailCost) : "",
  );
  const [costUnit, setCostUnit] = useState<ProductFormValues["costUnit"]>(
    defaultValues?.costUnit ?? null,
  );

  const pricingMargin = useMemo(
    () => calculatePricingMargin(parseCostInput(wholesaleCost), parseCostInput(retailCost)),
    [wholesaleCost, retailCost],
  );

  function addIngredient() {
    setIngredients((current) => [...current, newIngredientRow()]);
  }

  function removeIngredient(rowId: string) {
    setIngredients((current) => current.filter((row) => row.rowId !== rowId));
  }

  function updateIngredient(rowId: string, name: string) {
    setIngredients((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, name } : row)),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const hidden = form.elements.namedItem("ingredients") as HTMLInputElement;
    hidden.value = JSON.stringify(
      ingredients
        .map((row) => row.name.trim())
        .filter(Boolean)
        .map((name) => ({ name })),
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="ingredients" defaultValue="[]" />

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          aria-invalid={Boolean(errorFor(state, "name"))}
          placeholder="Aerial Max 4L"
          required
        />
        {errorFor(state, "name") ? (
          <p className="text-sm text-destructive">{errorFor(state, "name")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="manufacturer">Manufacturer</Label>
        <Input
          id="manufacturer"
          name="manufacturer"
          defaultValue={defaultValues?.manufacturer ?? ""}
          aria-invalid={Boolean(errorFor(state, "manufacturer"))}
          placeholder="Example Ag Chemicals"
        />
        {errorFor(state, "manufacturer") ? (
          <p className="text-sm text-destructive">{errorFor(state, "manufacturer")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="epaNumber">EPA Number</Label>
        <Input
          id="epaNumber"
          name="epaNumber"
          defaultValue={defaultValues?.epaNumber ?? ""}
          aria-invalid={Boolean(errorFor(state, "epaNumber"))}
          placeholder="1234-56"
        />
        {errorFor(state, "epaNumber") ? (
          <p className="text-sm text-destructive">{errorFor(state, "epaNumber")}</p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-md border border-dashed p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-medium">Ingredients</h3>
            <p className="text-xs text-muted-foreground">
              Active ingredients and other components listed on the product label.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
            + Add ingredient
          </Button>
        </div>

        {ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ingredients added yet. Add each active ingredient used in this product.
          </p>
        ) : (
          <div className="space-y-2">
            {ingredients.map((row) => (
              <div key={row.rowId} className="flex gap-2">
                <Input
                  value={row.name}
                  onChange={(event) => updateIngredient(row.rowId, event.target.value)}
                  placeholder="e.g. Glyphosate"
                  aria-label="Ingredient name"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIngredient(row.rowId)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {errorFor(state, "ingredients") ? (
          <p className="text-sm text-destructive">{errorFor(state, "ingredients")}</p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-md border border-dashed p-3">
        <div>
          <h3 className="font-medium">Pricing</h3>
          <p className="text-xs text-muted-foreground">
            Track wholesale and retail costs to see your margin. Wholesale cost is also used for quote
            pricing with markup.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="unitCost">Wholesale cost</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <DecimalInput
                id="unitCost"
                name="unitCost"
                className="pl-7"
                value={wholesaleCost}
                onChange={(event) => setWholesaleCost(event.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errorFor(state, "unitCost"))}
              />
            </div>
            {errorFor(state, "unitCost") ? (
              <p className="text-sm text-destructive">{errorFor(state, "unitCost")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="retailCost">Retail cost</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <DecimalInput
                id="retailCost"
                name="retailCost"
                className="pl-7"
                value={retailCost}
                onChange={(event) => setRetailCost(event.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errorFor(state, "retailCost"))}
              />
            </div>
            {errorFor(state, "retailCost") ? (
              <p className="text-sm text-destructive">{errorFor(state, "retailCost")}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="costUnit">Cost unit</Label>
          <Select
            id="costUnit"
            name="costUnit"
            value={costUnit ?? ""}
            onChange={(event) =>
              setCostUnit((event.target.value || null) as ProductFormValues["costUnit"])
            }
            className="w-full sm:max-w-xs"
            aria-label="Cost unit"
          >
            <option value="">Unit</option>
            <option value="gal">per gal</option>
            <option value="oz">per oz</option>
            <option value="fl_oz">per fl oz</option>
            <option value="lb">per lb</option>
          </Select>
        </div>

        <div
          className="rounded-md bg-muted/50 px-3 py-2.5 text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="font-medium">Overall margin</p>
          {pricingMargin ? (
            <div className="mt-1 space-y-0.5 text-muted-foreground">
              <p>
                Difference:{" "}
                <span
                  className={
                    pricingMargin.difference >= 0
                      ? "font-medium text-foreground"
                      : "font-medium text-destructive"
                  }
                >
                  {formatCost(pricingMargin.difference)} {costUnitLabel(costUnit)}
                </span>
              </p>
              {pricingMargin.markupPercent !== null ? (
                <p>
                  Markup:{" "}
                  <span className="font-medium text-foreground">
                    {pricingMargin.markupPercent.toFixed(1)}%
                  </span>{" "}
                  over wholesale
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Enter wholesale and retail costs to see the margin between them.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="restrictedUse" className="flex min-h-11 items-center gap-3">
          <input type="hidden" name="restrictedUse" value="false" />
          <Checkbox
            id="restrictedUse"
            name="restrictedUse"
            value="true"
            defaultChecked={defaultValues?.restrictedUse ?? false}
          />
          Restricted Use Pesticide (RUP)
        </Label>
        <p className="pl-7 text-sm text-muted-foreground">
          Restricted Use Pesticides require a certified applicator license to purchase and apply.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="active" className="flex min-h-11 items-center gap-3">
          <input type="hidden" name="active" value="false" />
          <Checkbox
            id="active"
            name="active"
            value="true"
            defaultChecked={defaultValues?.active ?? true}
          />
          Active
        </Label>
        {errorFor(state, "active") ? (
          <p className="text-sm text-destructive">{errorFor(state, "active")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          aria-invalid={Boolean(errorFor(state, "notes"))}
        />
        {errorFor(state, "notes") ? (
          <p className="text-sm text-destructive">{errorFor(state, "notes")}</p>
        ) : null}
      </div>

      {state.error ? (
        <FormAlert variant="error">
          {state.error}
        </FormAlert>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
