import Link from "next/link";
import { Building2, MapPinned, Users } from "lucide-react";

import { CustomersListClient } from "@/components/customers/CustomersListClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { SummaryStatCard, SummaryStatsGrid } from "@/components/shared/SummaryStatCard";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load customers.");
  }

  const totalCustomers = customers?.length ?? 0;
  const withEmailOrPhone = (customers ?? []).filter((customer) => customer.email || customer.phone).length;
  const withLocation = (customers ?? []).filter((customer) => customer.city || customer.state).length;

  return (
    <section className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Customers"
        description="Manage customer accounts and field relationships."
        action={
          <Link
            href="/customers/new"
            className={cn(
              buttonVariants(),
              "press-physics liquid-refraction rounded-xl border border-emerald-300/70 bg-emerald-500/90 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_24px_rgba(16,185,129,0.26)] hover:bg-emerald-500",
            )}
          >
            + New Customer
          </Link>
        }
      />

      <SummaryStatsGrid>
        <SummaryStatCard label="Total customers" value={totalCustomers} icon={Users} iconClassName="text-emerald-600/80" />
        <SummaryStatCard
          label="With contact info"
          value={withEmailOrPhone}
          icon={Building2}
          iconClassName="text-sky-600/80"
        />
        <SummaryStatCard
          label="With location"
          value={withLocation}
          icon={MapPinned}
          iconClassName="text-violet-600/80"
        />
      </SummaryStatsGrid>

      {!customers?.length ? (
        <Card className="liquid-reactive rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] sm:rounded-2xl">
          <CardHeader className="p-3 pb-0 sm:p-6 sm:pb-0">
            <CardTitle className="text-base sm:text-lg">No customers yet</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2 text-sm text-muted-foreground sm:p-5">
            Create your first customer to get started.
          </CardContent>
        </Card>
      ) : (
        <CustomersListClient customers={customers} />
      )}
    </section>
  );
}
