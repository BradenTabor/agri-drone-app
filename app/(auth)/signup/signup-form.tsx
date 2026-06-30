"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/brand";

import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = { error: null, success: null };

export function SignupForm() {
  const [state, action, isPending] = useActionState(signupAction, initialState);

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
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className="text-base sm:text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-slate-800">
          Phone number
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          className="text-base sm:text-sm"
        />
        <p className="text-xs text-slate-500">Used for account support and operational alerts.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="licenseCertNo" className="text-slate-800">
          Drone pilot license / certificate #
        </Label>
        <Input
          id="licenseCertNo"
          name="licenseCertNo"
          autoComplete="off"
          required
          className="text-base sm:text-sm"
        />
        <p className="text-xs text-slate-500">
          Enter your FAA Part 107 or state applicator certificate number.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-800">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="text-base sm:text-sm"
        />
        <p className="text-xs text-slate-500">Use at least 8 characters.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-800">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="text-base sm:text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200/80 bg-white/40 p-3">
        <Label htmlFor="dataConsent" className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
          <input type="hidden" name="dataConsent" value="false" />
          <Checkbox
            id="dataConsent"
            name="dataConsent"
            value="true"
            required
            className="mt-0.5"
          />
          <span>
            I agree that {BRAND.appName} may store my account and operational data, and contact me
            by email or phone with service updates, compliance notices, and related operational
            messages.
          </span>
        </Label>
      </div>

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      {state.success ? <FormAlert variant="success">{state.success}</FormAlert> : null}

      <Button
        type="submit"
        className="w-full min-h-11 bg-auth-accent-strong text-white hover:bg-auth-accent-strong/90 sm:text-sm"
        disabled={isPending}
      >
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
