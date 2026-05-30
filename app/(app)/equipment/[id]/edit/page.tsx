import Link from "next/link";
import { notFound } from "next/navigation";

import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { updateEquipmentAction } from "../../actions";

type EditEquipmentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEquipmentPage({ params }: EditEquipmentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: equipment, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !equipment) {
    notFound();
  }

  const action = updateEquipmentAction.bind(null, equipment.id);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Equipment</h1>
          <Link href="/equipment" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{equipment.identifier}</p>
      </header>

      <Card>
        <CardContent className="p-5">
        <EquipmentForm
          action={action}
          submitLabel="Save Equipment"
          pendingLabel="Saving..."
          defaultValues={{
            identifier: equipment.identifier,
            // TODO(0002): Add DB CHECK constraint for equipment.type and remove this defensive fallback.
            type:
              equipment.type === "truck" ||
              equipment.type === "sprayer" ||
              equipment.type === "drone"
                ? equipment.type
                : null,
            active: equipment.active,
            notes: equipment.notes,
          }}
        />
        </CardContent>
      </Card>
    </section>
  );
}
