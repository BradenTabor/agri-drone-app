export type FormDraftType = "mix-record" | "app-record";

export type DraftEnvelope<T> = {
  savedAt: number;
  data: T;
};

export type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

export function buildFormDraftKey(formType: FormDraftType, userId: string): string {
  return `${formType}:${userId}`;
}

export function parseFormDraftKey(key: string): { formType: FormDraftType; userId: string } | null {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex <= 0) {
    return null;
  }

  const formType = key.slice(0, separatorIndex);
  const userId = key.slice(separatorIndex + 1);

  if ((formType !== "mix-record" && formType !== "app-record") || !userId) {
    return null;
  }

  return { formType, userId };
}

export function formatDraftSavedAt(timestamp: number | string): string {
  const savedAt = typeof timestamp === "string" ? Date.parse(timestamp) : timestamp;
  if (!Number.isFinite(savedAt)) {
    return "recently";
  }

  const diffMs = Date.now() - savedAt;
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
