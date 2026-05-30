import Link from "next/link";

import { EquipmentListClient } from "@/components/equipment/EquipmentListClient";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function EquipmentPage() {
  const supabase = await createClient();
  const { data: equipment, error } = await supabase
    .from("equipment")
    .select("*")
    .is("deleted_at", null)
    .order("active", { ascending: false })
    .order("identifier", { ascending: true });

  if (error) {
    throw new Error("Unable to load equipment.");
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipment</h1>
          <p className="text-sm text-muted-foreground">
            Manage spray vehicles and aircraft used in field operations.
          </p>
        </div>
        <Link href="/equipment/new" className={buttonVariants()}>
          + New Equipment
        </Link>
      </header>

      {!equipment?.length ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No equipment yet. Create your first equipment entry to get started.
          </CardContent>
        </Card>
      ) : (
        <EquipmentListClient equipment={equipment} />
      )}
    </section>
  );
}
