"use client";

import { useCallback, useRef } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthGlassPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthGlassPanel({ children, className }: AuthGlassPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    panel.style.setProperty("--auth-pointer-x", `${x.toFixed(2)}%`);
    panel.style.setProperty("--auth-pointer-y", `${y.toFixed(2)}%`);
    panel.style.setProperty("--auth-pointer-active", "1");
  }, []);

  const handlePointerLeave = useCallback(() => {
    panelRef.current?.style.setProperty("--auth-pointer-active", "0");
  }, []);

  return (
    <Card
      ref={panelRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "auth-glass-panel auth-glass-refraction animate-auth-rise relative my-auto w-full overflow-hidden rounded-2xl border border-white/60 bg-white/88 shadow-[0_30px_80px_rgba(7,18,29,0.38)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-1 before:bg-auth-accent",
        "after:pointer-events-none after:absolute after:inset-0 after:z-[2] after:rounded-2xl after:border after:border-white/50",
        className,
      )}
    >
      <span aria-hidden className="auth-glass-refraction-layer pointer-events-none absolute inset-0 z-[3] rounded-2xl" />
      <CardContent className="auth-form-surface relative z-10 p-4 sm:p-6 lg:p-7">
        {children}
      </CardContent>
    </Card>
  );
}
