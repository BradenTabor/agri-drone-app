import type { DraftEnvelope } from "@/lib/formDrafts/types";

const STORAGE_PREFIX = "agri-drone-form-draft:";

export { buildFormDraftKey } from "@/lib/formDrafts/types";

export function readFormDraft<T>(key: string): DraftEnvelope<T> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DraftEnvelope<T> | T;
    if (
      parsed &&
      typeof parsed === "object" &&
      "savedAt" in parsed &&
      "data" in parsed &&
      typeof parsed.savedAt === "number"
    ) {
      return parsed as DraftEnvelope<T>;
    }

    return { savedAt: 0, data: parsed as T };
  } catch {
    return null;
  }
}

export function writeFormDraft<T>(key: string, data: T): DraftEnvelope<T> {
  const envelope: DraftEnvelope<T> = {
    savedAt: Date.now(),
    data,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(envelope));
    } catch {
      // Storage full or unavailable — ignore silently.
    }
  }

  return envelope;
}

export function clearFormDraft(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore.
  }
}
