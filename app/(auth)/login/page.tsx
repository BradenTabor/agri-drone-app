import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="text-sm text-foreground/80">
          Use your company credentials to continue.
        </p>
      </div>

      <LoginForm />

      <p className="text-sm text-foreground/80">
        Forgot your password?{" "}
        <Link
          href="/forgot-password"
          className="inline-block py-1 font-medium text-primary underline underline-offset-4"
        >
          Reset it
        </Link>
      </p>

      <p className="text-sm text-foreground/80">
        Need an account?{" "}
        <Link
          href="/signup"
          className="inline-block py-1 font-medium text-primary underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
