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
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-nav-panel"
            className="fixed inset-x-0 top-[73px] z-50 max-h-[calc(100dvh-73px)] overflow-y-auto border-b border-white/20 bg-background/95 p-4 pb-6 shadow-2xl backdrop-blur-xl"
          >
            <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
