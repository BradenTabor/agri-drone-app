"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { getNavBreadcrumb } from "@/components/shared/nav/navConfig";
import { cn } from "@/lib/utils";

type NavUtilityStripProps = {
  collapsed: boolean;
};

export function NavUtilityStrip({ collapsed }: NavUtilityStripProps) {
  const pathname = usePathname();
  const breadcrumb = getNavBreadcrumb(pathname);

  return (
    <div
      aria-hidden={collapsed}
      className={cn(
        "nav-utility-strip pointer-events-auto overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-[cubic-bezier(0.2,0.75,0.25,1)]",
        collapsed ? "max-h-0 opacity-0" : "max-h-8 opacity-100",
      )}
    >
      <div className="flex items-center justify-between gap-3 px-1 text-[0.68rem] font-medium tracking-wide sm:px-2">
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 sm:flex">
          {breadcrumb.map((crumb, index) => {
            const isLast = index === breadcrumb.length - 1;

            return (
              <span key={crumb.href} className="flex min-w-0 items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="size-3 shrink-0 text-slate-400/80 dark:text-slate-500" aria-hidden="true" />
                ) : null}
                {isLast ? (
                  <span className="truncate text-slate-700 dark:text-slate-200">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="truncate text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        <p className="truncate text-slate-600 sm:hidden dark:text-slate-300">{breadcrumb.at(-1)?.label}</p>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="nav-status-pill inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/14 dark:text-emerald-100">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70 opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            </span>
            Field Ready
          </span>
          <span className="hidden text-slate-500 lg:inline dark:text-slate-400">Synced just now</span>
        </div>
      </div>
    </div>
  );
}
