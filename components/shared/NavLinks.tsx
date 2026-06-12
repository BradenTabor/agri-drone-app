"use client";

import Link from "next/link";
import {
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileStack,
  Home,
  type LucideIcon,
  Map,
  Package2,
  Settings2,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/useIsClient";

type NavItem = {
  href: string;
  label: string;
  subtitle?: string;
  icon?: LucideIcon;
};

const coreNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/records", label: "Mix Records", icon: Sprout },
  { href: "/app-records", label: "App Records", icon: FileStack },
  { href: "/map", label: "Map", icon: Map },
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

export { coreNavItems, secondaryNavItems, isActivePath };
export type { NavItem };

type PanelPosition = {
  top: number;
  right: number;
};

type MoreNavDropdownProps = {
  pathname: string;
  onNavigate?: () => void;
  hasActiveSecondary: boolean;
};

function MoreNavDropdown({ pathname, onNavigate, hasActiveSecondary }: MoreNavDropdownProps) {
  const [open, setOpen] = useState(false);
  const isClient = useIsClient();
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    function updatePosition() {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPosition({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeAndNavigate() {
    setOpen(false);
    onNavigate?.();
  }

  const dropdownPanel =
    open && isClient && panelPosition
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              className="fixed inset-0 z-[45] cursor-default bg-slate-900/10 backdrop-blur-[2px] transition-opacity dark:bg-black/30"
              onPointerDown={() => setOpen(false)}
            />

            <div
              ref={panelRef}
              role="menu"
              aria-label="Workflow links"
              style={{ top: panelPosition.top, right: panelPosition.right }}
              className="liquid-reactive animate-liquid-rise fixed z-[50] w-[19rem] overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/96 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_24px_52px_rgba(15,23,42,0.22),0_0_0_1px_rgba(16,185,129,0.08)] backdrop-blur-3xl dark:border-white/20 dark:bg-slate-950/95 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_52px_rgba(2,6,23,0.65),0_0_0_1px_rgba(52,211,153,0.12)]"
            >
              <div className="glass-noise relative overflow-hidden border-b border-white/55 px-4 py-3.5 dark:border-white/12">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 -right-6 size-24 rounded-full bg-emerald-400/25 blur-2xl dark:bg-emerald-500/20"
                />
                <div className="relative flex items-start gap-2.5">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/12 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-emerald-400/25 dark:bg-emerald-500/18 dark:text-emerald-200">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-emerald-800/90 uppercase dark:text-emerald-200/90">
                      Workflow links
                    </p>
                    <p className="mt-0.5 text-[0.72rem] leading-snug text-slate-600/90 dark:text-slate-300/80">
                      Customers, fleet, materials, and billing
                    </p>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 p-2.5">
                {secondaryNavItems.map((item, index) => {
                  const active = isActivePath(pathname, item.href);
                  const ItemIcon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={closeAndNavigate}
                      aria-current={active ? "page" : undefined}
                      style={{ "--item-index": index } as CSSProperties}
                      className={cn(
                        "animate-more-nav-item press-physics liquid-refraction group/item relative inline-flex min-h-[3.35rem] items-center justify-start gap-3 rounded-xl px-2.5 py-2 text-[13px] font-medium tracking-tight transition-all",
                        active
                          ? "border border-emerald-500/30 bg-[linear-gradient(120deg,rgba(16,185,129,0.14),rgba(255,255,255,0.55))] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),inset_3px_0_0_rgba(16,185,129,0.9)] dark:border-emerald-400/30 dark:bg-[linear-gradient(120deg,rgba(16,185,129,0.2),rgba(15,23,42,0.55))] dark:text-white dark:shadow-[inset_3px_0_0_rgba(52,211,153,0.95)]"
                          : "border border-transparent text-slate-700/90 hover:border-white/60 hover:bg-white/62 hover:text-slate-900 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_18px_rgba(15,23,42,0.08)] dark:text-slate-200/90 dark:hover:border-white/15 dark:hover:bg-white/10 dark:hover:text-white",
                      )}
                    >
                      {ItemIcon ? (
                        <span
                          className={cn(
                            "inline-flex size-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200",
                            active
                              ? "border-emerald-500/35 bg-emerald-500/18 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/22 dark:text-emerald-200"
                              : "border-white/70 bg-white/78 text-slate-600 group-hover/item:-translate-y-px group-hover/item:border-emerald-500/25 group-hover/item:bg-emerald-500/10 group-hover/item:text-emerald-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-300 dark:group-hover/item:text-emerald-200",
                          )}
                        >
                          <ItemIcon className="size-3.5" aria-hidden={true} />
                        </span>
                      ) : null}
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate leading-none">{item.label}</span>
                        {item.subtitle ? (
                          <span className="truncate text-[0.68rem] font-normal tracking-normal text-slate-500 dark:text-slate-400/85">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </span>
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="ml-auto size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)] dark:bg-emerald-400"
                        />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "press-physics liquid-refraction inline-flex h-8 items-center gap-1 rounded-xl px-3 text-[13px] font-medium tracking-tight transition-all",
          open && "relative z-[50]",
          open || hasActiveSecondary
            ? "border border-white/70 bg-white/70 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_6px_16px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/25 dark:bg-white/14 dark:text-white"
            : "border border-transparent text-slate-700/90 hover:border-white/50 hover:bg-white/42 hover:text-slate-900 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_6px_14px_rgba(15,23,42,0.1)] dark:text-slate-200/90 dark:hover:bg-white/10 dark:hover:text-white",
          hasActiveSecondary &&
            !open &&
            "border-emerald-500/20 bg-emerald-500/8 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100",
        )}
      >
        More
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {dropdownPanel}
    </div>
  );
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

        <MoreNavDropdown
          pathname={pathname}
          onNavigate={onNavigate}
          hasActiveSecondary={hasActiveSecondary}
        />
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
