"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = { error: null, success: null };

export function SignupForm() {
  const [state, action, isPending] = useActionState(signupAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      {state.success ? <FormAlert variant="success">{state.success}</FormAlert> : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
