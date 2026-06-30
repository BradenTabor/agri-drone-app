import Link from "next/link";

import { AuthModeTabs } from "@/components/auth/AuthModeTabs";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="space-y-4 border-b border-slate-200/80 pb-4 sm:pb-5">
        <div className="space-y-1 text-center lg:text-left">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
            Create account
          </h1>
          <p className="text-sm text-slate-600">
            Create your operator account with email, pilot credentials, and contact details.
          </p>
        </div>
        <AuthModeTabs />
      </header>

      <SignupForm />

      <p className="border-t border-slate-200/80 pt-3 text-center text-sm text-slate-600 lg:hidden">
        Already have an account?{" "}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center py-1 font-semibold text-auth-accent underline underline-offset-4 sm:min-h-0 sm:inline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
