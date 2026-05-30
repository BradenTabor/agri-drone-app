import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[auth-layout] getUser error", error);
  }

  if (user) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/auth-background.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/30 via-background/55 to-background/85" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.14),transparent_50%),radial-gradient(circle_at_80%_90%,rgba(15,23,42,0.55),transparent_45%)]" />

      <div className="absolute left-4 top-4 z-10 rounded-full border border-white/30 bg-black/25 px-4 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm sm:left-8 sm:top-8">
        Agri Drone Ops
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/35 bg-white/16 shadow-[0_30px_80px_rgba(7,18,29,0.48)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_15%_8%,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.12)_38%,transparent_58%)] after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:border after:border-white/25">
        <CardContent className="relative p-6 bg-gradient-to-b from-white/22 via-white/10 to-white/6">
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
