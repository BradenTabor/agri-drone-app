import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { decimalToDms, dmsToString } from "@/lib/formatting/coordinates";
import { createClient } from "@/lib/supabase/server";

import { softDeleteCustomerAction } from "../actions";
import { softDeleteFieldAction } from "./fields/actions";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: customer, error: customerError },
    { data: fields, error: fieldsError },
    { data: quotes, error: quotesError },
  ] =
    await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("fields")
        .select("id,name,default_lat,default_lng,acres,notes")
        .eq("customer_id", id)
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("quotes")
        .select("id,quote_number,quote_date,status,total")
        .eq("customer_id", id)
        .is("deleted_at", null)
        .order("quote_date", { ascending: false }),
    ]);

  if (customerError || !customer) {
    notFound();
  }

  if (fieldsError) {
    throw new Error("Unable to load customer fields.");
  }
  if (quotesError) {
    throw new Error("Unable to load customer quotes.");
  }

  const deleteAction = softDeleteCustomerAction.bind(null, customer.id);

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">Customer detail view</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/customers" className={buttonVariants({ variant: "outline" })}>
              Back
            </Link>
            <Link
              href={`/customers/${customer.id}/edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              Edit
            </Link>
            <form action={deleteAction}>
              <ConfirmSubmitButton
                variant="destructive"
                confirmMessage={`Delete ${customer.name}? This can only be recovered by an admin.`}
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <DetailItem label="Contact" value={customer.contact_name} />
          <DetailItem label="Email" value={customer.email} />
          <DetailItem label="Phone" value={customer.phone} />
          <DetailItem
            label="Location"
            value={[customer.city, customer.state, customer.zip].filter(Boolean).join(" ")}
          />
          <DetailItem
            label="Address"
            value={customer.address}
            className="sm:col-span-2"
          />
          <DetailItem label="Notes" value={customer.notes} className="sm:col-span-2" />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Fields</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {fields?.length
                ? `${fields.length} field${fields.length === 1 ? "" : "s"}`
                : "No fields yet"}
            </p>
            <Link
              href={`/customers/${customer.id}/fields/new`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              + Add Field
            </Link>
          </div>

          {!fields?.length ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No fields added yet. Use &quot;+ Add Field&quot; to add the first one.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {fields.map((field) => (
                <FieldRow key={field.id} customerId={customer.id} field={field} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Quotes</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {quotes?.length
                ? `${quotes.length} quote${quotes.length === 1 ? "" : "s"}`
                : "No quotes yet"}
            </p>
            <Link
              href={`/quotes/new?customerId=${customer.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              + New Quote
            </Link>
          </div>

          {!quotes?.length ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No quotes created yet. Use &quot;+ New Quote&quot; to create the first one.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {quotes.map((quote) => (
                <li key={quote.id}>
                  <Card className="bg-muted/20">
                    <CardContent className="px-3 py-3 text-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <Link href={`/quotes/${quote.id}`} className="font-medium hover:underline">
                            {quote.quote_number || "Unnumbered quote"}
                          </Link>
                          <p className="text-muted-foreground">{quote.quote_date}</p>
                          <p className="text-muted-foreground">${Number(quote.total || 0).toFixed(2)}</p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${quoteStatusBadgeClass(quote.status)}`}
                        >
                          {quoteStatusLabel(quote.status)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function quoteStatusLabel(status: string): string {
  if (status === "sent") return "Sent";
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  return "Draft";
}

function quoteStatusBadgeClass(status: string): string {
  if (status === "sent") return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
  if (status === "accepted") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "declined") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  return "bg-muted text-muted-foreground";
}

function formatCoordinate(value: number | null, axis: "lat" | "lng"): string {
  if (value === null) {
    return "—";
  }

  try {
    return `${value.toFixed(6)} (${dmsToString(decimalToDms(value, axis))})`;
  } catch {
    return value.toString();
  }
}

function FieldRow({
  customerId,
  field,
}: {
  customerId: string;
  field: {
    id: string;
    name: string;
    default_lat: number | null;
    default_lng: number | null;
    acres: number | null;
    notes: string | null;
  };
}) {
  const deleteAction = softDeleteFieldAction.bind(null, customerId, field.id);

  return (
    <li>
      <Card className="bg-muted/20">
        <CardContent className="px-3 py-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="font-medium">{field.name}</div>
          <p className="break-words text-muted-foreground">
            {field.acres !== null ? `${field.acres} acres` : "Acres not set"}
          </p>
          <p className="break-words text-muted-foreground">
            Lat: {formatCoordinate(field.default_lat, "lat")}
          </p>
          <p className="break-words text-muted-foreground">
            Lng: {formatCoordinate(field.default_lng, "lng")}
          </p>
          {field.notes ? <p className="break-words text-muted-foreground">{field.notes}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Link
            href={`/customers/${customerId}/fields/${field.id}/edit`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Edit
          </Link>
          <form action={deleteAction}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              confirmMessage={`Delete field ${field.name}? This can only be recovered by an admin.`}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
        </CardContent>
      </Card>
    </li>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
