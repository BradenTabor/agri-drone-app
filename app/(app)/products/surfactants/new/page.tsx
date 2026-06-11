import Link from "next/link";

import { SurfactantForm } from "@/components/surfactants/SurfactantForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createSurfactantAction } from "../actions";

export default function NewSurfactantPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">New Surfactant</h1>
          <Link href="/products?tab=surfactants" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Add a surfactant that can be selected in mix and application records.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <SurfactantForm
            action={createSurfactantAction}
            submitLabel="Create Surfactant"
            pendingLabel="Creating..."
          />
        </CardContent>
      </Card>
    </section>
  );
}
