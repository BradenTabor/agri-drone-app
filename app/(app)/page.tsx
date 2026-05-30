import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function AppLandingPage() {
  const supabase = await createClient();
  const { data: records } = await supabase
    .from("mix_records")
    .select("id,record_date,customer_name_snapshot,field_name_snapshot,signed_typed_name,submitted_at")
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(10);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Agri Drone Operations
        </h1>
        <p className="text-muted-foreground">
          Keep customer, equipment, and product data ready for reliable mix records.
        </p>
      </div>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Quick start</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/records/new"
            className={cn(buttonVariants({ size: "lg" }), "min-h-11")}
          >
            + New Mix Record
          </Link>
          <Link
            href="/customers/new"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
          >
            + New Customer
          </Link>
          <Link
            href="/equipment/new"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
          >
            + New Equipment
          </Link>
          <Link
            href="/products/new"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
          >
            + New Product
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {!records?.length ? (
            <p className="text-sm text-muted-foreground">
              No records yet. Create the first one to start your log.
            </p>
          ) : (
            <ul className="space-y-2">
              {records.map((record) => (
                <li key={record.id}>
                  <Card className="bg-muted/20">
                    <CardContent className="p-3 text-sm">
                  <div className="font-medium">{record.record_date}</div>
                  <div className="text-muted-foreground">
                    {record.customer_name_snapshot || "—"} / {record.field_name_snapshot || "—"}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {record.signed_typed_name}
                    </span>
                    <Link
                      href={`/records/${record.id}`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      View
                    </Link>
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
