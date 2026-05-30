import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { MobileNavMenu } from "@/components/shared/MobileNavMenu";
import { NavLinks } from "@/components/shared/NavLinks";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export function Nav({ user }: { user: User }) {
  async function signOutAction() {
    "use server";

    const actionClient = await createClient();
    await actionClient.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="border-b border-white/15 bg-background/45 backdrop-blur-xl supports-[backdrop-filter]:bg-background/35">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <span className="truncate">Agri Drone Ops</span>
          </Link>
          <div className="hidden md:block">
            <NavLinks />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <MobileNavMenu />
          <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground lg:inline">
            {user?.email ?? "Signed in"}
          </span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
