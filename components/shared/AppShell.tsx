import type { User } from "@supabase/supabase-js";

import { LiquidGlassEffects } from "@/components/shared/LiquidGlassEffects";
import { Nav } from "@/components/shared/Nav";

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      <LiquidGlassEffects />
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.86] saturate-[0.95]"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/backgrounds/agri-ops-background.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,248,255,0.38)_0%,rgba(238,246,250,0.32)_40%,rgba(232,240,246,0.44)_100%)] dark:bg-[linear-gradient(180deg,rgba(8,14,20,0.56)_0%,rgba(10,14,20,0.48)_36%,rgba(11,16,20,0.62)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(255,255,255,0.26),transparent_32%),radial-gradient(circle_at_80%_8%,rgba(198,246,224,0.26),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(148,163,184,0.18),transparent_44%)] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_52%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.5),transparent_58%)]" />
      <div className="animate-liquid-shimmer pointer-events-none absolute inset-y-0 -left-1/4 w-2/4 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.25),transparent)] dark:bg-[linear-gradient(110deg,transparent,rgba(148,163,184,0.1),transparent)]" />

      <div className="relative z-30">
        <Nav user={user} />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6">
        <div className="glass-noise liquid-reactive animate-liquid-rise min-h-full rounded-[30px] border border-white/45 bg-[linear-gradient(140deg,rgba(255,255,255,0.38),rgba(255,255,255,0.22))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_20px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/12 dark:bg-[linear-gradient(155deg,rgba(11,15,20,0.58),rgba(15,23,42,0.45))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_20px_52px_rgba(2,6,23,0.35)] sm:p-5 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
