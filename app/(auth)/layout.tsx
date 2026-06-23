import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
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

  return <AuthShell>{children}</AuthShell>;
}
