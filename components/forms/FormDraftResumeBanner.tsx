import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import {
  hasMeaningfulAppDraft,
  summarizeAppRecordDraft,
  type AppRecordDraft,
} from "@/lib/formDrafts/appRecordDraft";
import {
  hasMeaningfulMixDraft,
  summarizeMixRecordDraft,
  type MixRecordDraft,
} from "@/lib/formDrafts/mixRecordDraft";
import type { FormDraftType } from "@/lib/formDrafts/types";
import { formatDraftSavedAt } from "@/lib/formDrafts/types";
import { createClient } from "@/lib/supabase/server";

type FormDraftResumeBannerProps = {
  formType: FormDraftType;
  href: string;
  label: string;
};

export async function FormDraftResumeBanner({ formType, href, label }: FormDraftResumeBannerProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: draft } = await supabase
    .from("form_drafts")
    .select("payload, updated_at")
    .eq("user_id", user.id)
    .eq("form_type", formType)
    .maybeSingle();

  if (!draft?.payload || typeof draft.payload !== "object") {
    return null;
  }

  const payload = draft.payload as MixRecordDraft | AppRecordDraft;
  const isMeaningful =
    formType === "mix-record"
      ? hasMeaningfulMixDraft(payload as MixRecordDraft)
      : hasMeaningfulAppDraft(payload as AppRecordDraft);

  if (!isMeaningful) {
    return null;
  }

  const summary =
    formType === "mix-record"
      ? summarizeMixRecordDraft(payload as MixRecordDraft)
      : summarizeAppRecordDraft(payload as AppRecordDraft);

  return (
    <FormAlert variant="info" className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="font-medium">You have an unfinished {label} draft</p>
        <p className="text-xs text-muted-foreground">
          {summary} · Last saved {formatDraftSavedAt(draft.updated_at)}
        </p>
      </div>
      <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
        Continue draft
      </Link>
    </FormAlert>
  );
}
