import Link from "next/link";

import { BrandLogo } from "@/components/shared/BrandLogo";
import { BRAND } from "@/lib/brand";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col items-center gap-3 border-b border-white/25 pb-4 text-center sm:gap-5 sm:pb-6">
        <BrandLogo
          size="hero"
          display="overlay"
          className="justify-center"
          imageClassName="mx-auto max-w-[min(100%,12rem)] sm:max-w-none"
        />
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Sign in</h1>
          <p className="text-sm font-medium text-foreground/85">{BRAND.appName}</p>
          <p className="text-xs text-foreground/70 sm:text-sm">Use your company credentials to continue.</p>
        </div>
      </header>

      <LoginForm />

      <div className="space-y-1 border-t border-white/20 pt-3 text-center sm:space-y-3 sm:pt-2">
        <p className="text-sm text-foreground/80">
          Forgot your password?{" "}
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center py-1 font-medium text-primary underline underline-offset-4 sm:min-h-0 sm:inline"
          >
            Reset it
          </Link>
        </p>

        <p className="text-sm text-foreground/80">
          Need an account?{" "}
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center py-1 font-medium text-primary underline underline-offset-4 sm:min-h-0 sm:inline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
