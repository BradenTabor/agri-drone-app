"use client";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import type { DraftSaveStatus } from "@/lib/formDrafts/types";

type FormDraftStatusProps = {
  restored: boolean;
  saveStatus: DraftSaveStatus;
  onDiscard: () => void;
};

function saveStatusLabel(saveStatus: DraftSaveStatus): string | null {
  switch (saveStatus) {
    case "saving":
      return "Saving draft…";
    case "saved":
      return "Draft saved";
    case "error":
      return "Saved on this device only";
    case "idle":
      return null;
    default: {
      const _exhaustive: never = saveStatus;
      return _exhaustive;
    }
  }
}

export function FormDraftStatus({ restored, saveStatus, onDiscard }: FormDraftStatusProps) {
  const statusLabel = saveStatusLabel(saveStatus);

  if (!restored && !statusLabel) {
    return null;
  }

  return (
    <FormAlert variant="info" className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        {restored ? (
          <p>Your previous progress was restored. Changes save automatically on this device and your account.</p>
        ) : null}
        {statusLabel ? <p className="text-xs text-muted-foreground">{statusLabel}</p> : null}
      </div>
      {restored ? (
        <Button type="button" variant="outline" size="sm" onClick={onDiscard}>
          Discard draft
        </Button>
      ) : null}
    </FormAlert>
  );
}
