import Link from "next/link";
import { notFound } from "next/navigation";

import { SurfactantForm } from "@/components/surfactants/SurfactantForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { updateSurfactantAction } from "../../actions";

type EditSurfactantPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSurfactantPage({ params }: EditSurfactantPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: surfactant, error } = await supabase
    .from("surfactants")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !surfactant) {
    notFound();
  }

  const action = updateSurfactantAction.bind(null, surfactant.id);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Surfactant</h1>
          <Link href="/products?tab=surfactants" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{surfactant.name}</p>
      </header>

      <Card>
        <CardContent className="p-5">
          <SurfactantForm
            action={action}
            submitLabel="Save Surfactant"
            pendingLabel="Saving..."
            defaultValues={{
              name: surfactant.name,
              manufacturer: surfactant.manufacturer,
              epaNumber: surfactant.epa_number,
              defaultUnit: surfactant.default_unit as "oz" | "fl_oz" | "gal" | "%" | null,
              unitCost: surfactant.unit_cost,
              costUnit: surfactant.cost_unit as "gal" | "oz" | "fl_oz" | "lb" | null,
              active: surfactant.active,
              notes: surfactant.notes,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
