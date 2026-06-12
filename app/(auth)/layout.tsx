import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/shared/BrandLogo";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND } from "@/lib/brand";
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
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,env(safe-area-inset-top))] text-foreground sm:px-6 sm:py-10 sm:pt-10">
      <video
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/auth-background.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-background/30 via-background/55 to-background/85" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.14),transparent_50%),radial-gradient(circle_at_80%_90%,rgba(15,23,42,0.55),transparent_45%)]" />

      <div className="fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 hidden items-center gap-3 rounded-2xl border border-white/30 bg-black/25 px-3 py-2 backdrop-blur-sm sm:flex sm:left-8 sm:top-8">
        <BrandLogo size="sm" display="overlay" tone="light" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">{BRAND.appName}</p>
          <p className="text-[0.65rem] tracking-[0.14em] text-white/75 uppercase">{BRAND.name}</p>
        </div>
      </div>

      <Card className="relative z-10 my-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/35 bg-white/16 shadow-[0_30px_80px_rgba(7,18,29,0.48)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_15%_8%,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.12)_38%,transparent_58%)] after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:border after:border-white/25">
        <CardContent className="relative bg-gradient-to-b from-white/22 via-white/10 to-white/6 p-4 sm:p-6">
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
