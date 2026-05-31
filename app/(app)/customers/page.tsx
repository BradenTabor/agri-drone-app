import Link from "next/link";
import { Building2, MapPinned, Users } from "lucide-react";

import { CustomersListClient } from "@/components/customers/CustomersListClient";
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
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer accounts and field relationships.
          </p>
        </div>
        <Link
          href="/customers/new"
          className={cn(
            buttonVariants(),
            "press-physics liquid-refraction rounded-xl border border-emerald-300/70 bg-emerald-500/90 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_24px_rgba(16,185,129,0.26)] hover:bg-emerald-500",
          )}
        >
          + New Customer
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Total customers</p>
              <Users className="size-4 text-emerald-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{totalCustomers}</p>
          </CardContent>
        </Card>
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">With contact info</p>
              <Building2 className="size-4 text-sky-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{withEmailOrPhone}</p>
          </CardContent>
        </Card>
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">With location</p>
              <MapPinned className="size-4 text-violet-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{withLocation}</p>
          </CardContent>
        </Card>
      </div>

      {!customers?.length ? (
        <Card className="liquid-reactive rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardHeader className="pb-0">
            <CardTitle>No customers yet</CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-sm text-muted-foreground">Create your first customer to get started.</CardContent>
        </Card>
      ) : (
        <CustomersListClient customers={customers} />
      )}
    </section>
  );
}
