"use client";

import { useEffect, useState } from "react";

import { searchAttachableMixRecords } from "@/app/(app)/app-records/actions";
import type { AttachableMixRecord } from "@/lib/app-records/mixAttach";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMixDetailLine, formatMixSummaryLine } from "@/lib/app-records/mixAttach";

type MixRecordPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAppRecordId: string | null;
  attachedMixIds: string[];
  onSelect: (mix: AttachableMixRecord) => void;
};

export function MixRecordPicker({
  open,
  onOpenChange,
  currentAppRecordId,
  attachedMixIds,
  onSelect,
}: MixRecordPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AttachableMixRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const delay = search ? 300 : 0;
    const handle = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void searchAttachableMixRecords(search, currentAppRecordId)
        .then((rows) => {
          if (!cancelled) setResults(rows);
        })
        .catch(() => {
          if (!cancelled) setError("Unable to search mix records.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [search, open, currentAppRecordId]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSearch("");
    }
    onOpenChange(nextOpen);
  }

  const attachedIdSet = new Set(attachedMixIds);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogPortal>
        <AlertDialogBackdrop />
        <AlertDialogContent className="flex max-h-[min(85vh,40rem)] w-[min(92vw,36rem)] flex-col">
          <AlertDialogTitle>Attach Mix Record</AlertDialogTitle>
          <AlertDialogDescription>
            Select one or more mix records to pull products and totals into this application record.
          </AlertDialogDescription>

          <div className="mt-4 space-y-3 overflow-y-auto">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer or field"
              className="min-h-11"
            />

            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {!loading && !error && results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unattached mix records found.</p>
            ) : null}

            <div className="space-y-2">
              {results.map((mix) => {
                const isAttached = attachedIdSet.has(mix.id);
                return (
                  <button
                    key={mix.id}
                    type="button"
                    disabled={isAttached}
                    onClick={() => onSelect(mix)}
                    className={`min-h-11 w-full rounded-md border px-3 py-2 text-left transition-colors ${
                      isAttached
                        ? "cursor-not-allowed bg-muted/40 opacity-70"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{formatMixSummaryLine(mix)}</p>
                        <p className="text-xs text-muted-foreground">{formatMixDetailLine(mix)}</p>
                      </div>
                      {isAttached ? (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">Attached</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="button" className="min-h-11" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
