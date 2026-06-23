import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { NavShell } from "@/components/shared/nav/NavShell";
import { createClient } from "@/lib/supabase/server";

export function Nav({ user }: { user: User }) {
  async function signOutAction() {
    "use server";

    const actionClient = await createClient();
    await actionClient.auth.signOut();
    redirect("/login");
  }

  return <NavShell user={user} signOutAction={signOutAction} />;
}
