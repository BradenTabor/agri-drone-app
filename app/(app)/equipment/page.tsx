import Link from "next/link";
import { CircleCheckBig, CircleSlash, Wrench } from "lucide-react";

import { EquipmentListClient } from "@/components/equipment/EquipmentListClient";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

  const totalEquipment = equipment?.length ?? 0;
  const activeEquipment = (equipment ?? []).filter((item) => item.active).length;
  const retiredEquipment = Math.max(0, totalEquipment - activeEquipment);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Equipment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage spray vehicles and aircraft used in field operations.
          </p>
        </div>
        <Link
          href="/equipment/new"
          className={cn(
            buttonVariants(),
            "press-physics liquid-refraction rounded-xl border border-emerald-300/70 bg-emerald-500/90 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_24px_rgba(16,185,129,0.26)] hover:bg-emerald-500",
          )}
        >
          + New Equipment
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Total equipment</p>
              <Wrench className="size-4 text-emerald-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{totalEquipment}</p>
          </CardContent>
        </Card>
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Active units</p>
              <CircleCheckBig className="size-4 text-emerald-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{activeEquipment}</p>
          </CardContent>
        </Card>
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Retired units</p>
              <CircleSlash className="size-4 text-amber-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{retiredEquipment}</p>
          </CardContent>
        </Card>
      </div>

      {!equipment?.length ? (
        <Card className="liquid-reactive rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardHeader className="pb-0">
            <CardTitle>No equipment yet</CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-sm text-muted-foreground">Create your first equipment entry to get started.</CardContent>
        </Card>
      ) : (
        <EquipmentListClient equipment={equipment} />
      )}
    </section>
  );
}
