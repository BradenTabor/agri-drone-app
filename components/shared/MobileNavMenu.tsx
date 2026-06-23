"use client";

import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import {
  coreNavItems,
  isActivePath,
  mobileQuickActions,
  secondaryNavItems,
  type NavItem,
} from "@/components/shared/nav/navConfig";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/lib/useIsClient";
import { cn } from "@/lib/utils";

type MobileNavLinkProps = {
  item: NavItem;
  active: boolean;
  variant: "grid" | "list";
  index: number;
  onNavigate: () => void;
};

function MobileNavLink({ item, active, variant, index, onNavigate }: MobileNavLinkProps) {
  const ItemIcon = item.icon;

  if (variant === "grid") {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        style={{ "--item-index": index } as CSSProperties}
        className={cn(
          "animate-more-nav-item press-physics liquid-refraction flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[13px] font-medium tracking-tight transition-all",
          active
            ? "border-emerald-500/30 bg-emerald-500/12 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-2px_0_rgba(16,185,129,0.85)] dark:border-emerald-400/30 dark:bg-emerald-500/16 dark:text-white"
            : "border-white/70 bg-white/72 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] active:bg-white/90 dark:border-white/15 dark:bg-white/8 dark:text-slate-100",
        )}
      >
        {ItemIcon ? (
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-xl border",
              active
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200"
                : "border-white/65 bg-white/80 text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-300",
            )}
          >
            <ItemIcon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
        <span className="leading-tight">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      style={{ "--item-index": index } as CSSProperties}
      className={cn(
        "animate-more-nav-item press-physics liquid-refraction flex min-h-[3.25rem] items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium tracking-tight transition-all",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),inset_3px_0_0_rgba(16,185,129,0.9)] dark:border-emerald-400/30 dark:bg-emerald-500/14 dark:text-white"
          : "border-white/65 bg-white/72 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] active:bg-white/88 dark:border-white/12 dark:bg-white/8 dark:text-slate-100",
      )}
    >
      {ItemIcon ? (
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-xl border",
            active
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200"
              : "border-white/65 bg-white/80 text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-300",
          )}
        >
          <ItemIcon className="size-3.5" aria-hidden="true" />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
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
          className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)] dark:bg-emerald-400"
        />
      ) : null}
    </Link>
  );
}

function MobileNavMenuContent() {
  const [open, setOpen] = useState(false);
  const isClient = useIsClient();
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  const menuPanel =
    open && isClient
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              tabIndex={-1}
              className="fixed inset-0 z-[45] cursor-default bg-slate-900/45 backdrop-blur-[3px] dark:bg-black/65"
              onPointerDown={closeMenu}
            />

            <div
              id="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="nav-island liquid-reactive glass-noise topo-texture animate-mobile-sheet-rise fixed inset-x-0 bottom-0 z-[50] flex max-h-[min(88dvh,720px)] flex-col overflow-hidden rounded-t-[1.75rem] border border-white/75 border-b-0 bg-white/97 shadow-[0_-12px_48px_rgba(15,23,42,0.24)] backdrop-blur-3xl dark:border-emerald-500/10 dark:bg-slate-950/97 dark:shadow-[0_-16px_52px_rgba(2,6,23,0.72),0_0_0_1px_rgba(52,211,153,0.06)]"
            >
              <div className="glass-noise shrink-0 border-b border-white/55 px-4 pt-3 pb-3.5 dark:border-white/12">
                <div
                  aria-hidden="true"
                  className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300/80 dark:bg-white/25"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-emerald-800/90 uppercase dark:text-emerald-200/90">
                      Navigation
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      Agri Drone Ops
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Close navigation menu"
                    onClick={closeMenu}
                    className="press-physics liquid-refraction size-9 shrink-0 rounded-xl border-white/70 bg-white/75 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/15 dark:bg-white/10 dark:text-white"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <section aria-label="Quick actions" className="mb-4">
                  <p className="mb-2 px-1 text-[0.65rem] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                    Quick actions
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {mobileQuickActions.map((action, index) => {
                      const ActionIcon = action.icon;

                      return (
                        <Link
                          key={action.href}
                          href={action.href}
                          onClick={closeMenu}
                          style={{ "--item-index": index } as CSSProperties}
                          className="animate-more-nav-item press-physics liquid-refraction flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-500/20 bg-[linear-gradient(160deg,rgba(16,185,129,0.12),rgba(255,255,255,0.72))] px-1.5 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] active:scale-[0.98] dark:border-emerald-400/20 dark:bg-[linear-gradient(160deg,rgba(16,185,129,0.16),rgba(15,23,42,0.55))]"
                        >
                          <span className="inline-flex size-8 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/18 dark:text-emerald-200">
                            <ActionIcon className="size-3.5" aria-hidden="true" />
                          </span>
                          <span className="text-[11px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
                            {action.label}
                          </span>
                          <span className="hidden text-[0.62rem] leading-tight text-slate-500 sm:block dark:text-slate-400">
                            {action.subtitle}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>

                <section aria-label="Main navigation">
                  <p className="mb-2 px-1 text-[0.65rem] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                    Main
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {coreNavItems.map((item, index) => (
                      <MobileNavLink
                        key={item.href}
                        item={item}
                        active={isActivePath(pathname, item.href)}
                        variant="grid"
                        index={index}
                        onNavigate={closeMenu}
                      />
                    ))}
                  </div>
                </section>

                <section aria-label="Operations navigation" className="mt-4">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className="inline-flex size-5 items-center justify-center rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-200">
                      <Sparkles className="size-3" aria-hidden="true" />
                    </span>
                    <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
                      Operations
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {secondaryNavItems.map((item, index) => (
                      <MobileNavLink
                        key={item.href}
                        item={item}
                        active={isActivePath(pathname, item.href)}
                        variant="list"
                        index={index + coreNavItems.length}
                        onNavigate={closeMenu}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "press-physics liquid-refraction rounded-xl border-white/60 bg-white/42 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] backdrop-blur-xl hover:bg-white/62 dark:border-white/20 dark:bg-white/8 dark:text-white dark:hover:bg-white/14",
          open && "relative z-[50]",
        )}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X /> : <Menu />}
      </Button>

      {menuPanel}
    </div>
  );
}

export function MobileNavMenu() {
  const pathname = usePathname();

  return <MobileNavMenuContent key={pathname} />;
}
