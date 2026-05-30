import type { User } from "@supabase/supabase-js";

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
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/backgrounds/agri-ops-background.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-background/62" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_48%),radial-gradient(circle_at_bottom,rgba(5,8,15,0.28),transparent_52%)]" />

      <div className="relative z-30">
        <Nav user={user} />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6">
        <div className="min-h-full rounded-2xl border border-white/15 bg-background/55 p-4 shadow-[0_20px_70px_rgba(2,6,23,0.35)] backdrop-blur-sm md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
