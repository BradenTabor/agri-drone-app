import { redirect } from "next/navigation";

import { AppShell } from "@/components/shared/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
