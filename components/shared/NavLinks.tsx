"use client";

import Link from "next/link";
import {
  ChevronDown,
  ClipboardList,
  DollarSign,
  type LucideIcon,
  Package2,
  Settings2,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  subtitle?: string;
  icon?: LucideIcon;
};

const coreNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/records", label: "Mix Records" },
  { href: "/app-records", label: "App Records" },
  { href: "/map", label: "Map" },
];

const secondaryNavItems: NavItem[] = [
  { href: "/customers", label: "Customers", subtitle: "Grow customer records", icon: Users },
  { href: "/equipment", label: "Equipment", subtitle: "Manage drone fleet", icon: Settings2 },
  { href: "/products", label: "Products", subtitle: "Track materials", icon: Package2 },
  { href: "/pricing", label: "Pricing", subtitle: "Set default rates", icon: DollarSign },
  { href: "/quotes", label: "Quotes", subtitle: "Prepare estimates", icon: ClipboardList },
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
                "press-physics liquid-refraction inline-flex h-8 items-center rounded-xl px-3 text-[13px] font-medium tracking-tight transition-all",
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
              "press-physics liquid-refraction inline-flex h-8 list-none cursor-pointer select-none items-center gap-1 rounded-xl px-3 text-[13px] font-medium tracking-tight transition-all",
              hasActiveSecondary
                ? "border border-white/70 bg-white/70 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_6px_16px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
                : "border border-transparent text-slate-700/90 hover:border-white/50 hover:bg-white/42 hover:text-slate-900 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_14px_rgba(15,23,42,0.1)]",
            )}
          >
            More
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="liquid-reactive animate-liquid-rise absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-white/75 bg-white/93 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_22px_46px_rgba(15,23,42,0.2)] backdrop-blur-3xl dark:border-white/20 dark:bg-slate-950/92 dark:shadow-[0_22px_46px_rgba(2,6,23,0.6)]">
            <p className="px-2 pb-1 text-[0.68rem] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-300/85">
              Workflow links
            </p>
            <div className="flex flex-col gap-1.5">
              {secondaryNavItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                const ItemIcon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "press-physics liquid-refraction inline-flex min-h-11 items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium tracking-tight transition-all",
                      active
                        ? "border border-white/65 bg-white/72 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/20 dark:bg-white/15 dark:text-white"
                        : "text-slate-700/90 hover:bg-white/46 hover:text-slate-900 dark:text-slate-200/90 dark:hover:bg-white/10 dark:hover:text-white",
                    )}
                  >
                    {ItemIcon ? (
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/65 bg-white/72 dark:border-white/20 dark:bg-white/10">
                        <ItemIcon className="size-3.5" aria-hidden={true} />
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{item.label}</span>
                      {item.subtitle ? (
                        <span className="truncate text-[0.68rem] font-normal tracking-normal text-slate-500 dark:text-slate-300/75">
                          {item.subtitle}
                        </span>
                      ) : null}
                    </span>
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
                ? "press-physics liquid-refraction inline-flex min-h-11 items-center justify-start rounded-xl px-4 text-sm font-medium transition-all"
                : "press-physics liquid-refraction inline-flex h-9 items-center rounded-xl px-3 text-[13px] font-medium tracking-tight transition-all",
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
