"use client";

import { ScanFace } from "lucide-react";
import { useEffect, useState } from "react";

import { formatPasskeyError, isPasskeySupported } from "@/lib/auth/passkeys";
import { createClient } from "@/lib/supabase/client";
import { useIsClient } from "@/lib/useIsClient";
import { cn } from "@/lib/utils";

type PasskeyEnrollMenuItemProps = {
  onComplete?: () => void;
};

export function PasskeyEnrollMenuItem({ onComplete }: PasskeyEnrollMenuItemProps) {
  const isClient = useIsClient();
  const [hasPasskey, setHasPasskey] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isClient || !isPasskeySupported()) {
      return;
    }

    let cancelled = false;

    async function loadPasskeys() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.passkey.list();

      if (cancelled) {
        return;
      }

      if (error) {
        setHasPasskey(false);
        return;
      }

      setHasPasskey((data?.length ?? 0) > 0);
    }

    void loadPasskeys();

    return () => {
      cancelled = true;
    };
  }, [isClient]);

  if (!isClient || !isPasskeySupported()) {
    return null;
  }

  async function handleEnablePasskey() {
    setIsPending(true);
    setMessage(null);
    setIsError(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.registerPasskey();

      if (error) {
        setIsError(true);
        setMessage(formatPasskeyError(error));
        return;
      }

      setHasPasskey(true);
      setMessage("Face ID sign-in is enabled on this device.");
      onComplete?.();
    } catch (caught) {
      setIsError(true);
      setMessage(formatPasskeyError(caught instanceof Error ? caught : new Error("Setup failed.")));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        role="menuitem"
        disabled={isPending || hasPasskey === true}
        className={cn(
          "press-physics inline-flex h-10 w-full items-center justify-start gap-2.5 rounded-xl px-2.5 text-sm text-slate-700 hover:bg-white/70 hover:text-slate-900 disabled:cursor-default disabled:opacity-70 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white",
        )}
        onClick={() => {
          void handleEnablePasskey();
        }}
      >
        <ScanFace className="size-4 shrink-0" aria-hidden="true" />
        {isPending
          ? "Setting up Face ID…"
          : hasPasskey
            ? "Face ID enabled"
            : "Enable Face ID sign-in"}
      </button>

      {message ? (
        <p
          className={cn(
            "px-2.5 text-xs leading-relaxed",
            isError ? "text-destructive" : "text-emerald-700 dark:text-emerald-300",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
