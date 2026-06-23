import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils";

type DashboardSurfaceVariant = "hero" | "card" | "inset" | "alert";

const variantStyles: Record<DashboardSurfaceVariant, string> = {
  hero: "glass-noise liquid-reactive surface-lift animate-liquid-rise relative overflow-hidden rounded-[22px] border-white/65 bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(237,247,244,0.36))] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-3xl sm:rounded-[26px] dark:border-white/15 dark:bg-[linear-gradient(135deg,rgba(8,16,24,0.84),rgba(16,34,27,0.7))] dark:text-slate-100 dark:shadow-[0_24px_60px_rgba(2,6,23,0.45)]",
  card: "liquid-reactive liquid-refraction surface-lift animate-liquid-rise rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.54),rgba(244,249,255,0.34))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:rounded-2xl dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(15,23,42,0.4))] dark:shadow-[0_12px_30px_rgba(2,6,23,0.25)]",
  inset:
    "rounded-xl border border-white/70 bg-white/44 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-white/5 dark:shadow-none",
  alert: "rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-none",
};

type DashboardSurfaceProps<T extends ElementType = "div"> = {
  as?: T;
  variant?: DashboardSurfaceVariant;
  animationDelayMs?: number;
} & ComponentPropsWithoutRef<T>;

export function DashboardSurface<T extends ElementType = "div">({
  as,
  variant = "card",
  className,
  animationDelayMs,
  style,
  ...props
}: DashboardSurfaceProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn(variantStyles[variant], className)}
      style={{
        ...style,
        ...(animationDelayMs !== undefined
          ? { animationDelay: `${animationDelayMs}ms` }
          : undefined),
      }}
      {...props}
    />
  );
}
