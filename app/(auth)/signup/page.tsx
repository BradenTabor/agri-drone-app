import Link from "next/link";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create account</h1>
        <p className="text-sm text-foreground/80">
          Sign up with your email and password to get started.
        </p>
      </div>

      <SignupForm />

      <p className="text-sm text-foreground/80">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
