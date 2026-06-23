"use client";

import { useEffect, useState } from "react";

export function DashboardHeroVisual() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduceMotion(mediaQuery.matches);
    syncMotion();
    mediaQuery.addEventListener("change", syncMotion);
    return () => mediaQuery.removeEventListener("change", syncMotion);
  }, []);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="topo-texture absolute inset-0 opacity-70 mix-blend-multiply dark:opacity-40 dark:mix-blend-soft-light" />
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(134,239,172,0.18)_0%,rgba(52,211,153,0.1)_28%,rgba(212,175,55,0.06)_48%,rgba(255,255,255,0.04)_100%)] dark:bg-[linear-gradient(145deg,rgba(16,185,129,0.14)_0%,rgba(6,78,59,0.26)_38%,rgba(15,23,42,0.42)_100%)]" />
        <div
          className={
            reduceMotion
              ? "absolute -right-[8%] top-[12%] h-[72%] w-[58%] rounded-[40%] bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.24),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.16),transparent_68%)]"
              : "animate-liquid-float absolute -right-[8%] top-[12%] h-[72%] w-[58%] rounded-[40%] bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.24),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.16),transparent_68%)]"
          }
        />
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.72)_0%,rgba(237,247,244,0.55)_42%,rgba(255,255,255,0.28)_100%)] dark:bg-[linear-gradient(125deg,rgba(8,16,24,0.88)_0%,rgba(16,34,27,0.72)_45%,rgba(8,16,24,0.55)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_72%_38%,rgba(26,61,46,0.12),transparent_68%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_72%_38%,rgba(52,211,153,0.1),transparent_68%)]" />
      </div>
    </>
  );
}
