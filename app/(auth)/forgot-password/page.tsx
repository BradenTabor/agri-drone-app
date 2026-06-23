import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/shared/BrandLogo";
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
    <div className="space-y-5 sm:space-y-6">
      <header className="space-y-4 border-b border-slate-200/80 pb-4 sm:pb-5">
        <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
          <BrandLogo
            size="lg"
            display="overlay"
            className="justify-center lg:hidden"
            imageClassName="h-14 w-auto sm:h-16"
          />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
              Forgot password
            </h1>
            <p className="text-sm text-slate-600">
              We&apos;ll email you a secure link to choose a new password.
            </p>
          </div>
        </div>
      </header>

      <ForgotPasswordForm />

      <p className="border-t border-slate-200/80 pt-3 text-center text-sm text-slate-600 lg:text-left">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center py-1 font-semibold text-auth-accent underline underline-offset-4 sm:min-h-0 sm:inline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
