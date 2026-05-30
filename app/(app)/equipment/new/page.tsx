import Link from "next/link";

import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createEquipmentAction } from "../actions";

export default function NewEquipmentPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">New Equipment</h1>
          <Link href="/equipment" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Add an equipment record that can be selected in mix records.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
        <EquipmentForm
          action={createEquipmentAction}
          submitLabel="Create Equipment"
          pendingLabel="Creating..."
        />
        </CardContent>
      </Card>
    </section>
  );
}
