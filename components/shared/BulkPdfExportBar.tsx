"use client";

import { Download, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { PdfDocumentKind } from "@/lib/pdf/buildPdfDocument";
import { cn } from "@/lib/utils";

export type BulkPdfExportItem = {
  kind: PdfDocumentKind;
  documentId: string;
  label: string;
};

type BulkPdfExportBarProps = {
  items: BulkPdfExportItem[];
  className?: string;
  selectionNoun?: string;
};

export function BulkPdfExportBar(props: BulkPdfExportBarProps) {
  // Remount when the visible item set changes so selection can't leak across pages.
  const pageKey = props.items.map((item) => `${item.kind}:${item.documentId}`).join("|");
  return <BulkPdfExportBarInner key={pageKey} {...props} />;
}

function BulkPdfExportBarInner({
  items,
  className,
  selectionNoun = "records",
}: BulkPdfExportBarProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const keyed = useMemo(
    () => items.map((item) => ({ ...item, key: `${item.kind}:${item.documentId}` })),
    [items],
  );

  const selectedCount = selected.size;
  const allSelected = keyed.length > 0 && selectedCount === keyed.length;

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(keyed.map((item) => item.key)));
  };

  const exportSelected = async () => {
    const payload = keyed
      .filter((item) => selected.has(item.key))
      .map((item) => ({ kind: item.kind, documentId: item.documentId }));

    if (payload.length === 0) {
      toast.message("Select at least one document to export.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/pdf-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Export failed (${response.status})`);
      }

      const addedHeader = response.headers.get("X-Pdf-Added");
      const skippedHeader = response.headers.get("X-Pdf-Skipped");
      const added = addedHeader ? Number(addedHeader) : payload.length;
      const skipped = skippedHeader ? Number(skippedHeader) : 0;

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `ATS PDF Export ${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);

      if (skipped > 0) {
        toast.success(
          `Downloaded ZIP with ${added} PDF${added === 1 ? "" : "s"} (${skipped} skipped).`,
        );
      } else {
        toast.success(`Downloaded ZIP with ${added} PDF${added === 1 ? "" : "s"}.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk export failed.");
    } finally {
      setBusy(false);
    }
  };

  if (keyed.length === 0) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/20 bg-[linear-gradient(125deg,rgba(255,255,255,0.92),rgba(236,244,238,0.78))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_12px_28px_-20px_rgba(44,98,64,0.4)] dark:border-white/10 dark:bg-white/5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight">
            Dispatch ZIP
          </p>
          <p className="text-xs text-muted-foreground">
            Bundle selected {selectionNoun} into one download · {selectedCount}/{keyed.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={toggleAll} disabled={busy}>
            {allSelected ? "Clear" : "Select page"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => void exportSelected()}
            disabled={busy || selectedCount === 0}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Download ZIP
          </Button>
        </div>
      </div>

      <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
        {keyed.map((item) => {
          const checked = selected.has(item.key);
          return (
            <li key={item.key}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors",
                  checked
                    ? "border-accent/40 bg-accent/10"
                    : "border-transparent bg-white/45 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10",
                )}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--brand-canopy)]"
                  checked={checked}
                  onChange={() => toggle(item.key)}
                  disabled={busy}
                />
                <span className="min-w-0 truncate">{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
