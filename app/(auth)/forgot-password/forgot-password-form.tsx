"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "./actions";

const initialState: ForgotPasswordState = { error: null, success: null };

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-800">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      {state.error ? (
        <FormAlert variant="error">
          {state.error}
        </FormAlert>
      ) : null}

      {state.success ? (
        <FormAlert variant="success">
          {state.success}
        </FormAlert>
      ) : null}

      <Button
        type="submit"
        className="w-full min-h-11 bg-auth-accent text-white hover:bg-auth-accent/90"
        disabled={isPending}
      >
        {isPending ? "Sending reset link..." : "Send reset link"}
      </Button>
    </form>
  );
}
