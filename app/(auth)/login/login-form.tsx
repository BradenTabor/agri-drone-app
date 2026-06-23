"use client";

import { type FormEvent, useState } from "react";

import { PasskeySignInButton } from "@/components/auth/PasskeySignInButton";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapLoginError } from "@/lib/auth/login-errors";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      setIsPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(mapLoginError(signInError));
        return;
      }

      window.location.assign("/");
    } catch {
      setError("Sign in is temporarily unavailable. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-800">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className="text-base sm:text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-800">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="text-base sm:text-sm"
        />
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <Button
        type="submit"
        className="w-full min-h-11 bg-auth-accent text-white hover:bg-auth-accent/90"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      <PasskeySignInButton />
    </form>
  );
}
