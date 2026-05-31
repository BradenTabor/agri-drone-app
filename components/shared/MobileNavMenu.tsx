"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { NavLinks } from "@/components/shared/NavLinks";
import { Button } from "@/components/ui/button";

export function MobileNavMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="press-physics liquid-refraction rounded-xl border-white/60 bg-white/42 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] backdrop-blur-xl hover:bg-white/62 dark:border-white/20 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X /> : <Menu />}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] dark:bg-black/55"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-nav-panel"
            className="liquid-reactive animate-liquid-rise fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-white/75 bg-white/96 p-3.5 pb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_24px_48px_rgba(15,23,42,0.22)] backdrop-blur-3xl dark:border-white/20 dark:bg-slate-950/94 dark:shadow-[0_24px_48px_rgba(2,6,23,0.62)] [&_a]:border [&_a]:border-white/70 [&_a]:bg-white/78 [&_a]:text-slate-800 [&_a]:shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:[&_a]:border-white/20 dark:[&_a]:bg-white/10 dark:[&_a]:text-slate-100"
          >
            <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
