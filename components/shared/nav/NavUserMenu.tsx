"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { PasskeyEnrollMenuItem } from "@/components/auth/PasskeyEnrollMenuItem";
import { useIsClient } from "@/lib/useIsClient";
import { cn } from "@/lib/utils";

type PanelPosition = {
  top: number;
  right: number;
};

function getInitials(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return local.slice(0, 2).toUpperCase();
}

type NavUserMenuProps = {
  email: string;
  signOutAction: () => Promise<void>;
};

export function NavUserMenu({ email, signOutAction }: NavUserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();
  const isClient = useIsClient();
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(email);

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

  const dropdownPanel =
    open && isClient && panelPosition
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close account menu"
              tabIndex={-1}
              className="fixed inset-0 z-[45] cursor-default bg-slate-900/10 backdrop-blur-[2px] dark:bg-black/30"
              onPointerDown={() => setOpen(false)}
            />

            <div
              ref={panelRef}
              role="menu"
              aria-label="Account menu"
              style={{ top: panelPosition.top, right: panelPosition.right }}
              className="liquid-reactive animate-liquid-rise fixed z-[50] w-[15.5rem] overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/96 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_20px_48px_rgba(15,23,42,0.2)] backdrop-blur-3xl dark:border-white/20 dark:bg-slate-950/95 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_52px_rgba(2,6,23,0.65)]"
            >
              <div className="glass-noise border-b border-white/55 px-4 py-3.5 dark:border-white/12">
                <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-emerald-800/90 uppercase dark:text-emerald-200/90">
                  Signed in
                </p>
                <p className="mt-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{email}</p>
              </div>

              <div className="space-y-1 p-2">
                <PasskeyEnrollMenuItem onComplete={() => setOpen(false)} />

                <Button
                  type="button"
                  variant="ghost"
                  role="menuitem"
                  disabled={isSigningOut}
                  className="press-physics h-10 w-full justify-start gap-2.5 rounded-xl px-2.5 text-sm text-slate-700 hover:bg-white/70 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={() => {
                    startSignOut(() => {
                      void signOutAction();
                    });
                  }}
                >
                  <LogOut className="size-4 shrink-0" aria-hidden="true" />
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </Button>
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
        aria-label="Account menu"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "press-physics liquid-refraction inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/50 bg-white/40 px-1.5 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition-all hover:bg-white/58 sm:px-2 dark:border-white/15 dark:bg-white/8 dark:text-white dark:hover:bg-white/14",
          open && "relative z-[50] border-white/70 bg-white/65 dark:border-white/25 dark:bg-white/14",
        )}
      >
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-[linear-gradient(145deg,rgba(16,185,129,0.18),rgba(255,255,255,0.65))] text-[0.65rem] font-semibold tracking-wide text-emerald-800 dark:border-emerald-400/30 dark:bg-[linear-gradient(145deg,rgba(16,185,129,0.22),rgba(15,23,42,0.55))] dark:text-emerald-100">
          {initials}
        </span>
        <span className="hidden max-w-[9rem] truncate text-[13px] font-medium lg:inline">{email}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 opacity-70 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {dropdownPanel}
    </div>
  );
}
