import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { MobileNavMenu } from "@/components/shared/MobileNavMenu";
import { NavLinks } from "@/components/shared/NavLinks";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export function Nav({ user }: { user: User }) {
  async function signOutAction() {
    "use server";

    const actionClient = await createClient();
    await actionClient.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-[linear-gradient(125deg,rgba(246,250,255,0.3),rgba(229,246,241,0.24))] shadow-[0_14px_35px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/15 dark:bg-[linear-gradient(125deg,rgba(7,10,18,0.68),rgba(7,22,20,0.6))] dark:shadow-[0_14px_35px_rgba(2,6,23,0.4)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "press-physics liquid-refraction min-w-0 rounded-2xl border border-white/60 bg-white/45 px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl hover:bg-white/65 dark:border-white/20 dark:bg-white/8 dark:hover:bg-white/14 sm:px-2.5 md:px-3",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.78),rgba(216,247,236,0.72))] text-[0.68rem] leading-none font-bold tracking-[0.08em] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_6px_15px_rgba(16,185,129,0.18)] dark:border-white/20 dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.24),rgba(16,185,129,0.22))] dark:text-emerald-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]">
                AD
              </span>
              <span className="flex min-w-0 flex-col items-start">
                <span className="max-w-[8.4rem] truncate text-[0.92rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:max-w-none sm:text-sm">
                  Agri Drone Ops
                </span>
                <span className="hidden text-[0.65rem] tracking-[0.12em] text-emerald-700/85 uppercase dark:text-emerald-100/75 lg:block">
                  Operations Suite
                </span>
              </span>
            </span>
          </Link>
          <div className="hidden rounded-2xl border border-white/60 bg-white/42 px-1 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-2xl dark:border-white/20 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] md:block">
            <NavLinks strategy="condensed" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <MobileNavMenu />
          <span className="hidden max-w-[11rem] truncate text-sm text-slate-700/85 dark:text-emerald-100/85 lg:inline">
            {user?.email ?? "Signed in"}
          </span>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="press-physics liquid-refraction rounded-xl border-white/60 bg-white/44 px-2.5 text-xs text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)] hover:bg-white/62 sm:px-3 sm:text-sm dark:border-white/20 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
