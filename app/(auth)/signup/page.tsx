import Link from "next/link";

import { AuthModeTabs } from "@/components/auth/AuthModeTabs";
import { BrandLogo } from "@/components/shared/BrandLogo";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
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
              Create account
            </h1>
            <p className="text-sm text-slate-600">
              Create your operator account with email, pilot credentials, and contact details.
            </p>
          </div>
        </div>
        <AuthModeTabs />
      </header>

      <SignupForm />

      <p className="border-t border-slate-200/80 pt-3 text-center text-sm text-slate-600 lg:hidden">
        Already have an account?{" "}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center py-1 font-semibold text-auth-accent-strong underline underline-offset-4 sm:min-h-0 sm:inline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
