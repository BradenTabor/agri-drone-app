"use client";

import { useEffect } from "react";

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function LiquidGlassEffects() {
  useEffect(() => {
    const root = document.documentElement;

    const handleScroll = () => {
      const max = Math.max(1, window.innerHeight * 1.2);
      const progress = clamp01(window.scrollY / max);
      root.style.setProperty("--liquid-scroll-progress", progress.toFixed(3));
    };

    const handlePointerMove = (event: PointerEvent) => {
      const x = clamp01(event.clientX / Math.max(1, window.innerWidth));
      const y = clamp01(event.clientY / Math.max(1, window.innerHeight));
      root.style.setProperty("--liquid-pointer-x", `${(x * 100).toFixed(2)}%`);
      root.style.setProperty("--liquid-pointer-y", `${(y * 100).toFixed(2)}%`);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return null;
}
