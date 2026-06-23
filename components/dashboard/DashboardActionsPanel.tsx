import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardSurface } from "@/components/dashboard/DashboardSurface";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  {
    href: "/customers/new",
    title: "New customer",
    description: "Create account and field profile",
  },
  {
    href: "/equipment/new",
    title: "New equipment",
    description: "Register drone and spray setup",
  },
  {
    href: "/products/new",
    title: "New product",
    description: "Add herbicide and label details",
  },
] as const;

export function DashboardActionsPanel() {
  return (
    <DashboardSurface variant="card" animationDelayMs={320}>
      <CardHeader className="p-3 pb-1 sm:p-5 sm:pb-2">
        <CardTitle className="font-heading text-base tracking-tight sm:text-lg">Next Best Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1.5 p-3 pt-1 sm:gap-2 sm:p-5 sm:pt-2">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className="press-physics group flex items-center justify-between rounded-xl border border-white/70 bg-white/56 px-2.5 py-2.5 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all hover:bg-white/78 sm:px-3 sm:py-3 dark:border-white/20 dark:bg-white/8 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/14"
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-forest)]/10 text-[0.65rem] font-semibold text-[var(--brand-forest)] dark:bg-emerald-500/15 dark:text-emerald-200">
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium sm:text-base">{action.title}</span>
                <span className="truncate text-xs text-muted-foreground">{action.description}</span>
              </span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </CardContent>
    </DashboardSurface>
  );
}
