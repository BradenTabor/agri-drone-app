"use client";

import { useActionState, useMemo, useState } from "react";

import type { QuoteFormState } from "@/app/(app)/quotes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { computeTotals, lineAmount } from "@/lib/quotes/calculations";

const initialState: QuoteFormState = { error: null };

type QuoteFormValues = {
  quoteNumber: string | null;
  status: "draft" | "sent" | "accepted" | "declined";
  customerId: string | null;
  customerName: string;
  fieldId: string | null;
  sourceAppRecordId: string | null;
  quoteDate: string;
  validUntil: string | null;
  acres: number | null;
  serviceFor: string | null;
  taxRate: number | null;
  otherLabel: string | null;
  otherAmount: number | null;
  notes: string | null;
  terms: string | null;
};

type LineItemRow = {
  rowId: string;
  kind: "aerial" | "product" | "fee" | "custom";
  productId: string | null;
  // UI-only selection token for the library picker: "", "product:<id>", or
  // "surfactant:<id>". Surfactants are not persisted to product_id (which is a
  // FK to the products table), so this keeps the dropdown in sync during a
  // single editing session.
  libraryKey: string;
  description: string;
  basis: "per_acre" | "flat";
  quantity: string;
  unitPrice: string;
  amount: string;
  amountTouched: boolean;
};

type QuoteDefaultLineItem = {
  kind: "aerial" | "product" | "fee" | "custom";
  productId: string | null;
  description: string;
  basis: "per_acre" | "flat";
  quantity: number;
  unitPrice: number;
  amount: number;
};

type QuoteProductOption = {
  id: string;
  name: string;
  unitCost: number | null;
  costUnit: string | null;
};

type QuoteFormProps = {
  action: (state: QuoteFormState, formData: FormData) => Promise<QuoteFormState>;
  submitLabel?: string;
  pendingLabel?: string;
  customers: Array<{ id: string; name: string }>;
  fields: Array<{ id: string; name: string; acres: number | null; customer_id: string }>;
  products: QuoteProductOption[];
  surfactants?: QuoteProductOption[];
  defaultValues?: Partial<QuoteFormValues>;
  defaultLineItems?: QuoteDefaultLineItem[];
  minimumJobFee?: number | null;
};

function newLineItem(): LineItemRow {
  return {
    rowId: crypto.randomUUID(),
    kind: "custom",
    productId: null,
    libraryKey: "",
    description: "",
    basis: "flat",
    quantity: "1",
    unitPrice: "0",
    amount: "0",
    amountTouched: false,
  };
}

function toLineItemRow(item: QuoteDefaultLineItem): LineItemRow {
  return {
    rowId: crypto.randomUUID(),
    kind: item.kind,
    productId: item.productId,
    libraryKey: item.productId ? `product:${item.productId}` : "",
    description: item.description,
    basis: item.basis,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    amount: String(item.amount),
    amountTouched: false,
  };
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function kindLabel(kind: LineItemRow["kind"]): string {
  if (kind === "aerial") return "Aerial";
  if (kind === "product") return "Product";
  if (kind === "fee") return "Fee";
  return "Custom";
}

function kindBadgeClass(kind: LineItemRow["kind"]): string {
  if (kind === "aerial") return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
  if (kind === "product") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (kind === "fee") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
}

function errorFor(state: QuoteFormState, field: keyof QuoteFormValues | "lineItems") {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

export function QuoteForm({
  action,
  submitLabel = "Save Quote",
  pendingLabel = "Saving...",
  customers,
  fields,
  products,
  surfactants = [],
  defaultValues,
  defaultLineItems,
  minimumJobFee = null,
}: QuoteFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [customerId, setCustomerId] = useState(defaultValues?.customerId ?? "");
  const [customerName, setCustomerName] = useState(defaultValues?.customerName ?? "");
  const [fieldId, setFieldId] = useState(defaultValues?.fieldId ?? "");
  const [status, setStatus] = useState<QuoteFormValues["status"]>(defaultValues?.status ?? "draft");
  const [acres, setAcres] = useState(
    defaultValues?.acres !== undefined && defaultValues?.acres !== null
      ? String(defaultValues.acres)
      : "",
  );
  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    defaultLineItems?.length ? defaultLineItems.map(toLineItemRow) : [newLineItem()],
  );
  const [taxRate, setTaxRate] = useState<string>(
    defaultValues?.taxRate != null ? String(defaultValues.taxRate) : "0",
  );
  const [otherAmount, setOtherAmount] = useState<string>(
    defaultValues?.otherAmount != null ? String(defaultValues.otherAmount) : "0",
  );

  const visibleFields = useMemo(
    () => fields.filter((field) => field.customer_id === customerId),
    [fields, customerId],
  );
  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const surfactantsById = useMemo(
    () => new Map(surfactants.map((surfactant) => [surfactant.id, surfactant])),
    [surfactants],
  );

  const totals = useMemo(
    () =>
      computeTotals(
        lineItems.map((line) => ({
          amount: parseNumber(line.amount),
        })),
        Number(taxRate) || 0,
        Number(otherAmount) || 0,
      ),
    [lineItems, taxRate, otherAmount],
  );

  function setLineItemValue(
    rowId: string,
    field: keyof Pick<LineItemRow, "description" | "basis" | "quantity" | "unitPrice" | "amount">,
    value: string,
  ) {
    setLineItems((current) =>
      current.map((line) => {
        if (line.rowId !== rowId) return line;
        const updated = { ...line, [field]: value };
        if (field === "amount") {
          updated.amountTouched = true;
          return updated;
        }
        if ((field === "quantity" || field === "unitPrice") && !line.amountTouched) {
          const quantity = parseNumber(field === "quantity" ? value : line.quantity);
          const unitPrice = parseNumber(field === "unitPrice" ? value : line.unitPrice);
          updated.amount = String(lineAmount(quantity, unitPrice));
        }
        return updated;
      }),
    );
  }

  function formatLibraryDescription(option: QuoteProductOption): string {
    return option.costUnit ? `${option.name} (${option.costUnit})` : option.name;
  }

  function handleLibrarySelect(rowId: string, libraryKey: string) {
    setLineItems((current) =>
      current.map((line) => {
        if (line.rowId !== rowId) return line;

        if (!libraryKey) {
          return {
            ...line,
            libraryKey: "",
            productId: null,
            kind: line.kind === "product" ? "custom" : line.kind,
          };
        }

        const separatorIndex = libraryKey.indexOf(":");
        const type = libraryKey.slice(0, separatorIndex);
        const id = libraryKey.slice(separatorIndex + 1);
        const option = type === "surfactant" ? surfactantsById.get(id) : productsById.get(id);
        if (!option) return line;

        const next = {
          ...line,
          kind: "product" as const,
          // Only products map to the products FK; surfactants are seeded as a
          // priced line without a product_id.
          productId: type === "product" ? id : null,
          libraryKey,
          description: formatLibraryDescription(option),
        };

        const suggestedUnitPrice = option.unitCost ?? 0;
        const shouldReplaceUnitPrice =
          line.unitPrice.trim() === "" || Number(line.unitPrice) === 0 || line.libraryKey !== libraryKey;

        if (shouldReplaceUnitPrice) {
          next.unitPrice = String(suggestedUnitPrice);
        }
        if (!line.amountTouched) {
          next.amount = String(lineAmount(parseNumber(line.quantity), parseNumber(next.unitPrice)));
        }

        return next;
      }),
    );
  }

  function addLine() {
    setLineItems((current) => [...current, newLineItem()]);
  }

  function removeLine(rowId: string) {
    setLineItems((current) => {
      const next = current.filter((line) => line.rowId !== rowId);
      return next.length ? next : [newLineItem()];
    });
  }

  function handleCustomerChange(nextCustomerId: string) {
    setCustomerId(nextCustomerId);
    setFieldId("");
    const customer = customers.find((item) => item.id === nextCustomerId);
    setCustomerName(customer?.name ?? "");
  }

  function handleFieldChange(nextFieldId: string) {
    setFieldId(nextFieldId);
    const field = fields.find((item) => item.id === nextFieldId);
    if (field?.acres != null) {
      setAcres(String(field.acres));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const lineItemsInput = form.elements.namedItem("lineItems") as HTMLInputElement;
    lineItemsInput.value = JSON.stringify(
      lineItems.map((line) => ({
        kind: line.kind,
        productId: line.productId || undefined,
        description: line.description,
        basis: line.basis,
        quantity: parseNumber(line.quantity),
        unitPrice: parseNumber(line.unitPrice),
        amount: parseNumber(line.amount),
      })),
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="lineItems" defaultValue="[]" />
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="customerName" value={customerName} />
      <input type="hidden" name="fieldId" value={fieldId} />
      <input type="hidden" name="sourceAppRecordId" value={defaultValues?.sourceAppRecordId ?? ""} />
      <input type="hidden" name="status" value={status} />

      <Card>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base">Quote Header</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerIdSelect">Customer</Label>
            <Select
              id="customerIdSelect"
              value={customerId}
              onChange={(event) => handleCustomerChange(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "customerId"))}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
            {errorFor(state, "customerId") ? (
              <p className="text-sm text-destructive">{errorFor(state, "customerId")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldIdSelect">Field</Label>
            <Select
              id="fieldIdSelect"
              value={fieldId}
              onChange={(event) => handleFieldChange(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "fieldId"))}
            >
              <option value="">No field selected</option>
              {visibleFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </Select>
            {errorFor(state, "fieldId") ? (
              <p className="text-sm text-destructive">{errorFor(state, "fieldId")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="acres">Acres</Label>
            <DecimalInput
              id="acres"
              name="acres"
              value={acres}
              onChange={(event) => setAcres(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "acres"))}
              placeholder="0.00"
            />
            {errorFor(state, "acres") ? (
              <p className="text-sm text-destructive">{errorFor(state, "acres")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceFor">For (service description)</Label>
            <Input
              id="serviceFor"
              name="serviceFor"
              defaultValue={defaultValues?.serviceFor ?? ""}
              placeholder="Herbicide Application"
              aria-invalid={Boolean(errorFor(state, "serviceFor"))}
            />
            {errorFor(state, "serviceFor") ? (
              <p className="text-sm text-destructive">{errorFor(state, "serviceFor")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quoteNumber">Quote #</Label>
            <Input
              id="quoteNumber"
              name="quoteNumber"
              defaultValue={defaultValues?.quoteNumber ?? ""}
              aria-invalid={Boolean(errorFor(state, "quoteNumber"))}
              placeholder="Q-2026-001"
            />
            {errorFor(state, "quoteNumber") ? (
              <p className="text-sm text-destructive">{errorFor(state, "quoteNumber")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quoteDate">Quote date</Label>
            <Input
              id="quoteDate"
              name="quoteDate"
              type="date"
              defaultValue={defaultValues?.quoteDate ?? todayDateString()}
              aria-invalid={Boolean(errorFor(state, "quoteDate"))}
              required
            />
            {errorFor(state, "quoteDate") ? (
              <p className="text-sm text-destructive">{errorFor(state, "quoteDate")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="validUntil">Valid until</Label>
            <Input
              id="validUntil"
              name="validUntil"
              type="date"
              defaultValue={defaultValues?.validUntil ?? ""}
              aria-invalid={Boolean(errorFor(state, "validUntil"))}
            />
            {errorFor(state, "validUntil") ? (
              <p className="text-sm text-destructive">{errorFor(state, "validUntil")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusSelect">Status</Label>
            <Select
              id="statusSelect"
              value={status}
              onChange={(event) => setStatus(event.target.value as QuoteFormValues["status"])}
              aria-invalid={Boolean(errorFor(state, "status"))}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </Select>
            {errorFor(state, "status") ? (
              <p className="text-sm text-destructive">{errorFor(state, "status")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Customer snapshot</Label>
            <p className="min-h-11 rounded-md border border-input bg-muted/30 px-3 py-2.5 text-sm">
              {customerName || "No customer selected"}
            </p>
            {errorFor(state, "customerName") ? (
              <p className="text-sm text-destructive">{errorFor(state, "customerName")}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            + Add line
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {lineItems.map((line) => (
            <div key={line.rowId} className="space-y-3 rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${kindBadgeClass(line.kind)}`}
                >
                  {kindLabel(line.kind)}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.rowId)}>
                  Remove
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Product / surfactant from library</Label>
                <Select
                  value={line.libraryKey}
                  onChange={(event) => handleLibrarySelect(line.rowId, event.target.value)}
                >
                  <option value="">Custom line</option>
                  {products.length > 0 ? (
                    <optgroup label="Products">
                      {products.map((product) => (
                        <option key={product.id} value={`product:${product.id}`}>
                          {product.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {surfactants.length > 0 ? (
                    <optgroup label="Surfactants">
                      {surfactants.map((surfactant) => (
                        <option key={surfactant.id} value={`surfactant:${surfactant.id}`}>
                          {surfactant.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={line.description}
                  onChange={(event) => setLineItemValue(line.rowId, "description", event.target.value)}
                  placeholder="Line item description"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Basis</Label>
                  <Select
                    value={line.basis}
                    onChange={(event) => setLineItemValue(line.rowId, "basis", event.target.value)}
                  >
                    <option value="per_acre">Per acre</option>
                    <option value="flat">Flat</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{line.basis === "per_acre" ? "Acres" : "Qty"}</Label>
                  <DecimalInput
                    value={line.quantity}
                    onChange={(event) => setLineItemValue(line.rowId, "quantity", event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit price</Label>
                  <DecimalInput
                    value={line.unitPrice}
                    onChange={(event) => setLineItemValue(line.rowId, "unitPrice", event.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <DecimalInput
                    value={line.amount}
                    onChange={(event) => setLineItemValue(line.rowId, "amount", event.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}

          {errorFor(state, "lineItems") ? (
            <p className="text-sm text-destructive">{errorFor(state, "lineItems")}</p>
          ) : null}

          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-sm font-medium">{formatMoney(totals.subtotal)}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="taxRate" className="text-sm text-muted-foreground">
                Tax rate (%)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="taxRate"
                  name="taxRate"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                  inputMode="decimal"
                  className="w-20 text-right"
                />
                <span className="w-20 text-right text-sm">{formatMoney(totals.tax)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Input
                name="otherLabel"
                defaultValue={defaultValues?.otherLabel ?? ""}
                placeholder="Other (e.g. acre credit)"
                className="flex-1"
              />
              <Input
                name="otherAmount"
                value={otherAmount}
                onChange={(event) => setOtherAmount(event.target.value)}
                inputMode="decimal"
                className="w-24 text-right"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-semibold">{formatMoney(totals.total)}</p>
            </div>
            {minimumJobFee != null && totals.total < minimumJobFee ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Below your minimum job fee of {formatMoney(minimumJobFee)}.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base">Notes & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
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
          <div className="space-y-2">
            <Label htmlFor="terms">Terms</Label>
            <Textarea
              id="terms"
              name="terms"
              defaultValue={defaultValues?.terms ?? ""}
              aria-invalid={Boolean(errorFor(state, "terms"))}
            />
            {errorFor(state, "terms") ? (
              <p className="text-sm text-destructive">{errorFor(state, "terms")}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
