"use client";

import { ScanFace } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { formatPasskeyError, isPasskeySupported } from "@/lib/auth/passkeys";
import { createClient } from "@/lib/supabase/client";
import { useIsClient } from "@/lib/useIsClient";

export function PasskeySignInButton() {
  const router = useRouter();
  const isClient = useIsClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isClient || !isPasskeySupported()) {
    return null;
  }

  async function handlePasskeySignIn() {
    setIsPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPasskey();

      if (signInError) {
        setError(formatPasskeyError(signInError));
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      }
    } catch (caught) {
      setError(formatPasskeyError(caught instanceof Error ? caught : new Error("Sign-in failed.")));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200/80" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-transparent px-2 text-slate-500">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full min-h-11 gap-2 border-slate-200/90 bg-white/50 text-base sm:text-sm"
        disabled={isPending}
        onClick={() => {
          void handlePasskeySignIn();
        }}
      >
        <ScanFace className="size-4 shrink-0" aria-hidden="true" />
        {isPending ? "Waiting for Face ID…" : "Sign in with Face ID"}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Use Face ID, Touch ID, or your device passkey after enabling it from your account menu.
      </p>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}
    </div>
  );
}
