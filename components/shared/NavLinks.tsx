"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

const coreNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/records", label: "Mix Records" },
  { href: "/app-records", label: "App Records" },
  { href: "/map", label: "Map" },
];

const secondaryNavItems: NavItem[] = [
  { href: "/customers", label: "Customers" },
  { href: "/equipment", label: "Equipment" },
  { href: "/products", label: "Products" },
  { href: "/pricing", label: "Pricing" },
  { href: "/quotes", label: "Quotes" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinksProps = {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
  strategy?: "full" | "condensed";
};

export function NavLinks({ orientation = "horizontal", onNavigate, strategy = "full" }: NavLinksProps) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";
  const condensedDesktop = !isVertical && strategy === "condensed";
  const allNavItems = [...coreNavItems, ...secondaryNavItems];
  const hasActiveSecondary = secondaryNavItems.some((item) => isActivePath(pathname, item.href));

  if (condensedDesktop) {
    return (
      <nav className="flex flex-wrap items-center gap-1">
        {coreNavItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-xl px-3 text-[13px] font-medium tracking-tight transition-all",
                active
                  ? "border border-white/70 bg-white/70 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_6px_16px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
                  : "border border-transparent text-slate-700/90 hover:border-white/50 hover:bg-white/42 hover:text-slate-900 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_14px_rgba(15,23,42,0.1)]",
              )}
            >
              {item.label}
            </Link>
          );
        })}

        <details className="group relative">
          <summary
            className={cn(
              "inline-flex h-8 list-none cursor-pointer select-none items-center gap-1 rounded-xl px-3 text-[13px] font-medium tracking-tight transition-all",
              hasActiveSecondary
                ? "border border-white/70 bg-white/70 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_6px_16px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
                : "border border-transparent text-slate-700/90 hover:border-white/50 hover:bg-white/42 hover:text-slate-900 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_14px_rgba(15,23,42,0.1)]",
            )}
          >
            More
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-52 rounded-2xl border border-white/65 bg-white/60 p-2 shadow-[0_20px_45px_rgba(15,23,42,0.18)] backdrop-blur-3xl dark:border-white/20 dark:bg-slate-950/70 dark:shadow-[0_20px_45px_rgba(2,6,23,0.55)]">
            <div className="flex flex-col gap-1">
              {secondaryNavItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center justify-start rounded-xl px-3 text-[13px] font-medium tracking-tight transition-all",
                      active
                        ? "border border-white/65 bg-white/72 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/20 dark:bg-white/15 dark:text-white"
                        : "text-slate-700/90 hover:bg-white/46 hover:text-slate-900 dark:text-slate-200/90 dark:hover:bg-white/10 dark:hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </details>
      </nav>
    );
  }

  return (
    <nav className={cn("flex", isVertical ? "flex-col gap-2" : "flex-wrap items-center gap-1")}>
      {allNavItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              isVertical
                ? "inline-flex min-h-11 items-center justify-start rounded-xl px-4 text-sm font-medium transition-all"
                : "inline-flex h-9 items-center rounded-xl px-3 text-[13px] font-medium tracking-tight transition-all",
              active
                ? "border border-white/60 bg-white/66 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/20 dark:bg-white/18 dark:text-white"
                : "text-slate-700/90 hover:bg-white/42 hover:text-slate-900 dark:text-slate-200/90 dark:hover:bg-white/10 dark:hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
