"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  deleteServerFormDraft,
  fetchServerFormDraft,
  loadBestFormDraft,
  upsertServerFormDraft,
} from "@/lib/formDrafts/serverSync";
import { createDraftSaveGuard } from "@/lib/formDrafts/draftSaveGuard";
import { clearFormDraft, readFormDraft, writeFormDraft } from "@/lib/formDrafts/storage";
import type { DraftSaveStatus } from "@/lib/formDrafts/types";
import { parseFormDraftKey } from "@/lib/formDrafts/types";

type UseFormDraftOptions<T> = {
  draftKey: string | null | undefined;
  value: T;
  onRestore: (draft: T) => void;
  hasMeaningfulContent?: (value: T) => boolean;
  debounceMs?: number;
};

type HydrationState = {
  ready: boolean;
  restoredFromDraft: boolean;
};

const SERVER_SNAPSHOT_READY: HydrationState = { ready: true, restoredFromDraft: false };
const SERVER_SNAPSHOT_PENDING: HydrationState = { ready: false, restoredFromDraft: false };

type DraftHydrationStore = {
  state: HydrationState;
  listeners: Set<() => void>;
  publish: (next: HydrationState) => void;
};

function createDraftHydrationStore(initialReady: boolean): DraftHydrationStore {
  return {
    state: { ready: initialReady, restoredFromDraft: false },
    listeners: new Set(),
    publish(next) {
      this.state = next;
      this.listeners.forEach((listener) => listener());
    },
  };
}

export function useFormDraft<T>({
  draftKey,
  value,
  onRestore,
  hasMeaningfulContent,
  debounceMs = 800,
}: UseFormDraftOptions<T>) {
  const skipNextSaveRef = useRef(false);
  const onRestoreRef = useRef(onRestore);
  const hasMeaningfulContentRef = useRef(hasMeaningfulContent);
  const hydrationKeyRef = useRef<string | null | undefined>(undefined);
  const saveGuardRef = useRef(createDraftSaveGuard());

  const [store] = useState(() => createDraftHydrationStore(!draftKey));
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>("idle");

  useEffect(() => {
    onRestoreRef.current = onRestore;
    hasMeaningfulContentRef.current = hasMeaningfulContent;
  });

  useEffect(() => {
    if (hydrationKeyRef.current === draftKey && store.state.ready) {
      return;
    }

    hydrationKeyRef.current = draftKey;

    if (!draftKey) {
      store.publish({ ready: true, restoredFromDraft: false });
      return;
    }

    let cancelled = false;

    void (async () => {
      const envelope = await loadBestFormDraft(
        draftKey,
        readFormDraft<T>,
        fetchServerFormDraft<T>,
        parseFormDraftKey,
      );

      if (cancelled) {
        return;
      }

      const draft = envelope?.data ?? null;
      const shouldRestore = Boolean(
        draft && (!hasMeaningfulContentRef.current || hasMeaningfulContentRef.current(draft)),
      );

      if (shouldRestore && draft) {
        skipNextSaveRef.current = true;
        writeFormDraft(draftKey, draft);
        onRestoreRef.current(draft);
        store.publish({ ready: true, restoredFromDraft: true });
        return;
      }

      store.publish({ ready: true, restoredFromDraft: false });
    })();

    return () => {
      cancelled = true;
    };
  }, [draftKey, store]);

  const { ready, restoredFromDraft } = useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
    () => store.state,
    () => (draftKey ? SERVER_SNAPSHOT_PENDING : SERVER_SNAPSHOT_READY),
  );

  const saveNow = useCallback(() => {
    if (!draftKey || !ready) {
      return;
    }

    if (hasMeaningfulContentRef.current && !hasMeaningfulContentRef.current(value)) {
      clearFormDraft(draftKey);
      setSaveStatus("idle");

      const parsed = parseFormDraftKey(draftKey);
      if (parsed) {
        const generation = saveGuardRef.current.beginSave();
        void deleteServerFormDraft(parsed.formType, parsed.userId).catch(() => {
          if (saveGuardRef.current.isGenerationCurrent(generation)) {
            setSaveStatus("error");
          }
        });
      }
      return;
    }

    setSaveStatus("saving");
    writeFormDraft(draftKey, value);

    const parsed = parseFormDraftKey(draftKey);
    if (!parsed) {
      setSaveStatus("saved");
      return;
    }

    const generation = saveGuardRef.current.beginSave();
    void upsertServerFormDraft(parsed.formType, parsed.userId, value)
      .then(() => {
        if (saveGuardRef.current.isGenerationCurrent(generation)) {
          setSaveStatus("saved");
        }
      })
      .catch(() => {
        if (saveGuardRef.current.isGenerationCurrent(generation)) {
          setSaveStatus("error");
        }
      });
  }, [draftKey, ready, value]);

  useEffect(() => {
    if (!draftKey || !ready) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const saveGuard = saveGuardRef.current;
    const timer = window.setTimeout(() => {
      saveGuard.clearDebouncedTimerIfMatch(timer);
      saveNow();
    }, debounceMs);
    saveGuard.setDebouncedTimer(timer);

    return () => {
      window.clearTimeout(timer);
      saveGuard.clearDebouncedTimerIfMatch(timer);
    };
  }, [debounceMs, draftKey, ready, value, saveNow]);

  useEffect(() => {
    if (!draftKey || !ready) {
      return;
    }

    const hasContent = hasMeaningfulContentRef.current?.(value) ?? true;
    if (!hasContent) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [draftKey, ready, value]);

  const clearDraft = useCallback(() => {
    saveGuardRef.current.invalidateInFlightSaves();

    if (draftKey) {
      clearFormDraft(draftKey);

      const parsed = parseFormDraftKey(draftKey);
      if (parsed) {
        void deleteServerFormDraft(parsed.formType, parsed.userId).catch(() => {
          setSaveStatus("error");
        });
      }
    }

    setSaveStatus("idle");
    store.publish({ ready: true, restoredFromDraft: false });
  }, [draftKey, store]);

  return {
    ready,
    restoredFromDraft,
    saveStatus,
    clearDraft,
    saveNow,
  };
}
