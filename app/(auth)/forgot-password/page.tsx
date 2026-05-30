import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/login" className="inline-block py-1 text-primary underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
