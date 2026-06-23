"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const MODES = [
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create account" },
] as const;

export function AuthModeTabs() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200/90 bg-slate-100/90 p-1"
    >
      {MODES.map(({ href, label }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "press-physics inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors",
              isActive
                ? "bg-white text-auth-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_14px_rgba(15,23,42,0.1)]"
                : "text-slate-600 hover:bg-white/70 hover:text-auth-accent",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
