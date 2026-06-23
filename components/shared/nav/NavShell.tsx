"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/shared/BrandLogo";
import { MobileNavMenu } from "@/components/shared/MobileNavMenu";
import { NavLinks } from "@/components/shared/NavLinks";
import { NavCommandPalette } from "@/components/shared/nav/NavCommandPalette";
import { NavUserMenu } from "@/components/shared/nav/NavUserMenu";
import { NavUtilityStrip } from "@/components/shared/nav/NavUtilityStrip";
import { cn } from "@/lib/utils";

type NavShellProps = {
  user: User;
  signOutAction: () => Promise<void>;
};

export function NavShell({ user, signOutAction }: NavShellProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 48);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function handleChange() {
      setIsMobile(mediaQuery.matches);
    }

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const showBrandText = !isMobile || !scrolled;

  return (
    <header className="pointer-events-none sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="animate-nav-mount mx-auto flex w-full max-w-6xl flex-col gap-1.5">
        <NavUtilityStrip collapsed={scrolled} />

        <div
          data-scrolled={scrolled ? "true" : "false"}
          className={cn(
            "nav-island liquid-reactive glass-noise topo-texture animate-nav-mount-delayed pointer-events-auto flex w-full items-center justify-between gap-2 rounded-[1.35rem] border border-white/40 px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-[padding,box-shadow,border-color] duration-300 dark:border-emerald-500/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_44px_rgba(2,6,23,0.5),0_0_0_1px_rgba(52,211,153,0.06)]",
            scrolled ? "nav-island-scrolled py-1.5 sm:px-2.5" : "py-2 sm:px-3 sm:py-2.5",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3 lg:gap-4">
            <Link
              href="/"
              className="press-physics shrink-0 rounded-xl px-1 py-0.5 transition-colors hover:bg-white/35 dark:hover:bg-white/8"
            >
              <BrandLogo
                size="navCompact"
                display="overlay"
                showText={showBrandText}
                className={cn(
                  "items-center gap-2 transition-[transform,gap] duration-300",
                  scrolled ? "scale-[0.94] sm:scale-100" : "scale-100",
                  !showBrandText && "gap-0",
                )}
              />
            </Link>

            <nav
              aria-label="Main navigation"
              className="hidden min-w-0 flex-1 justify-center md:flex"
            >
              <NavLinks strategy="condensed" />
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <MobileNavMenu />
            <NavCommandPalette />
            <NavUserMenu email={user.email ?? "Signed in"} signOutAction={signOutAction} />
          </div>
        </div>
      </div>
    </header>
  );
}
