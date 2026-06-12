import Link from "next/link";
import { CircleCheckBig, CircleSlash, Wrench } from "lucide-react";

import { EquipmentListClient } from "@/components/equipment/EquipmentListClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { SummaryStatCard, SummaryStatsGrid } from "@/components/shared/SummaryStatCard";
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
    <section className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Equipment"
        description="Manage spray vehicles and aircraft used in field operations."
        action={
          <Link
            href="/equipment/new"
            className={cn(
              buttonVariants(),
              "press-physics liquid-refraction rounded-xl border border-emerald-300/70 bg-emerald-500/90 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_24px_rgba(16,185,129,0.26)] hover:bg-emerald-500",
            )}
          >
            + New Equipment
          </Link>
        }
      />

      <SummaryStatsGrid>
        <SummaryStatCard label="Total equipment" value={totalEquipment} icon={Wrench} iconClassName="text-emerald-600/80" />
        <SummaryStatCard
          label="Active units"
          value={activeEquipment}
          icon={CircleCheckBig}
          iconClassName="text-emerald-600/80"
        />
        <SummaryStatCard
          label="Retired units"
          value={retiredEquipment}
          icon={CircleSlash}
          iconClassName="text-amber-600/80"
        />
      </SummaryStatsGrid>

      {!equipment?.length ? (
        <Card className="liquid-reactive rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] sm:rounded-2xl">
          <CardHeader className="p-3 pb-0 sm:p-6 sm:pb-0">
            <CardTitle className="text-base sm:text-lg">No equipment yet</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2 text-sm text-muted-foreground sm:p-5">
            Create your first equipment entry to get started.
          </CardContent>
        </Card>
      ) : (
        <EquipmentListClient equipment={equipment} />
      )}
    </section>
  );
}
