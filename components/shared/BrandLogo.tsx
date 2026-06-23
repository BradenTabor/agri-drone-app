import Image from "next/image";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  size?: "sm" | "md" | "lg" | "xl" | "navCompact" | "nav" | "hero";
  showText?: boolean;
  variant?: "default" | "auth";
  /** framed = pill/badge container; overlay = logo only, scales freely */
  display?: "framed" | "overlay";
  /** overlay tone on dark vs light surfaces */
  tone?: "dark" | "light";
};

const sizeConfig = {
  sm: { width: 22, height: 33, frame: "size-9", overlay: "h-9 w-auto" },
  md: { width: 26, height: 39, frame: "size-10", overlay: "h-10 w-auto" },
  lg: { width: 34, height: 51, frame: "size-14", overlay: "h-14 w-auto" },
  xl: { width: 48, height: 72, frame: "size-16", overlay: "h-20 w-auto" },
  navCompact: { width: 48, height: 72, frame: "size-10", overlay: "h-10 w-auto sm:h-11" },
  nav: { width: 80, height: 120, frame: "size-12", overlay: "h-14 w-auto sm:h-16 md:h-20" },
  hero: { width: 160, height: 240, frame: "size-20", overlay: "h-36 w-auto sm:h-48 md:h-56" },
} as const;

export function BrandLogo({
  className,
  imageClassName,
  size = "md",
  showText = false,
  variant = "default",
  display = "framed",
  tone = "dark",
}: BrandLogoProps) {
  const config = sizeConfig[size];

  const logoImage = (
    <Image
      src={BRAND.logoPath}
      alt={`${BRAND.name} logo`}
      width={config.width}
      height={config.height}
      className={cn(
        display === "overlay"
          ? cn(
              config.overlay,
              "object-contain drop-shadow-[0_2px_12px_rgba(15,23,42,0.28)]",
              tone === "light" && "brightness-0 invert drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]",
            )
          : "h-auto w-auto max-h-full max-w-full object-contain",
        imageClassName,
      )}
      priority
    />
  );

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {display === "overlay" ? (
        <span className="relative shrink-0">{logoImage}</span>
      ) : (
        <span
          className={cn(
            config.frame,
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_6px_15px_rgba(16,185,129,0.12)]",
            variant === "auth"
              ? "border-white/40 bg-white/92 p-1"
              : "border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,252,0.88))] p-1 dark:border-white/20 dark:bg-white/95",
          )}
        >
          {logoImage}
        </span>
      )}

      {showText ? (
        <span className="flex min-w-0 flex-col items-start">
          <span className="font-heading max-w-[8.4rem] truncate text-[0.88rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:max-w-none sm:text-[0.9rem]">
            {BRAND.appName}
          </span>
          <span className="hidden text-[0.65rem] tracking-[0.12em] text-emerald-700/85 uppercase dark:text-emerald-100/75 lg:block">
            {BRAND.tagline}
          </span>
        </span>
      ) : null}
    </span>
  );
}
