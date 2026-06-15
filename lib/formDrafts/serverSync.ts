import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import type { DraftEnvelope } from "@/lib/formDrafts/types";
import type { FormDraftType } from "@/lib/formDrafts/types";

function isAuthSyncError(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? "";
  const code = error.code?.toLowerCase() ?? "";

  return (
    code.includes("refresh_token") ||
    code.includes("session_not_found") ||
    message.includes("refresh token") ||
    message.includes("jwt expired") ||
    message.includes("not authenticated")
  );
}

export async function fetchServerFormDraft<T>(
  formType: FormDraftType,
  userId: string,
): Promise<DraftEnvelope<T> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("form_drafts")
    .select("payload, updated_at")
    .eq("user_id", userId)
    .eq("form_type", formType)
    .maybeSingle();

  if (isAuthSyncError(error)) {
    return null;
  }

  if (error || !data) {
    return null;
  }

  return {
    savedAt: Date.parse(data.updated_at),
    data: data.payload as T,
  };
}

export async function upsertServerFormDraft<T>(
  formType: FormDraftType,
  userId: string,
  data: T,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("form_drafts").upsert(
    {
      user_id: userId,
      form_type: formType,
      payload: data as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,form_type" },
  );

  if (isAuthSyncError(error)) {
    return;
  }

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteServerFormDraft(formType: FormDraftType, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("form_drafts")
    .delete()
    .eq("user_id", userId)
    .eq("form_type", formType);

  if (isAuthSyncError(error)) {
    return;
  }

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadBestFormDraft<T>(
  draftKey: string,
  localReader: (key: string) => DraftEnvelope<T> | null,
  serverFetcher: (formType: FormDraftType, userId: string) => Promise<DraftEnvelope<T> | null>,
  parseKey: (key: string) => { formType: FormDraftType; userId: string } | null,
): Promise<DraftEnvelope<T> | null> {
  const parsed = parseKey(draftKey);
  const localDraft = localReader(draftKey);

  if (!parsed) {
    return localDraft;
  }

  let serverDraft: DraftEnvelope<T> | null = null;
  try {
    serverDraft = await serverFetcher(parsed.formType, parsed.userId);
  } catch {
    return localDraft;
  }

  if (!localDraft) {
    return serverDraft;
  }
  if (!serverDraft) {
    return localDraft;
  }

  return localDraft.savedAt >= serverDraft.savedAt ? localDraft : serverDraft;
}
