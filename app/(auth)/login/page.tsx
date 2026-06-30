import Link from "next/link";

import { AuthModeTabs } from "@/components/auth/AuthModeTabs";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="space-y-4 border-b border-slate-200/80 pb-4 sm:pb-5">
        <div className="space-y-1 text-center lg:text-left">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
            Sign in
          </h1>
          <p className="text-sm text-slate-600">
            Access your mix records, customers, and field data.
          </p>
        </div>
        <AuthModeTabs />
      </header>

      <LoginForm />

      <div className="space-y-1 border-t border-slate-200/80 pt-3 text-center sm:space-y-3 sm:pt-2 lg:text-left">
        <p className="text-sm text-slate-600">
          Forgot your password?{" "}
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center py-1 font-semibold text-auth-accent underline underline-offset-4 sm:min-h-0 sm:inline"
          >
            Reset it
          </Link>
        </p>

        <p className="text-sm text-slate-600 lg:hidden">
          Need an account?{" "}
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center py-1 font-semibold text-auth-accent underline underline-offset-4 sm:min-h-0 sm:inline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
