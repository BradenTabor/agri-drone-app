"use client";

import {
  Check,
  Download,
  Eye,
  FileArchive,
  Link2,
  Loader2,
  Mail,
  Share2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { PdfDocumentKind } from "@/lib/pdf/buildPdfDocument";
import {
  buildPdfSharePayload,
  detectPdfShareCapability,
  isShareAbortError,
  pdfFetchErrorMessage,
  toPdfFile,
  type PdfShareCapability,
} from "@/lib/pdf/sharePdf";
import { cn } from "@/lib/utils";

export type PdfExportPanelProps = {
  pdfUrl: string;
  filename: string;
  documentKind: PdfDocumentKind;
  documentId: string;
  documentLabel?: string;
  className?: string;
  density?: "comfortable" | "compact";
};

type BusyAction = "share" | "download" | "preview" | "link" | "email" | null;

type CacheEntry = {
  blob: Blob;
  objectUrl: string;
};

const KIND_META: Record<
  PdfDocumentKind,
  { short: string; tone: string; rail: string }
> = {
  mix_record: {
    short: "Mix",
    tone: "bg-amber-100/90 text-amber-950 ring-amber-300/70 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/30",
    rail: "from-amber-500/80 via-[var(--brand-canopy)]/70 to-emerald-700/60",
  },
  app_record: {
    short: "App",
    tone: "bg-sky-100/90 text-sky-950 ring-sky-300/70 dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/30",
    rail: "from-sky-500/80 via-[var(--brand-canopy)]/70 to-teal-700/60",
  },
  quote: {
    short: "Quote",
    tone: "bg-emerald-100/90 text-emerald-950 ring-emerald-300/70 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/30",
    rail: "from-emerald-500/80 via-[var(--brand-gold)]/50 to-[var(--brand-forest)]/70",
  },
};

const subscribeNoop = () => () => {};

const SERVER_PDF_SHARE_CAPABILITY: PdfShareCapability = {
  canShareFiles: false,
  isAppleTouch: false,
  prefersShareOverDownload: false,
};

let clientPdfShareCapability: PdfShareCapability | null = null;

function getClientPdfShareCapability(): PdfShareCapability {
  // useSyncExternalStore requires a stable snapshot reference when data is unchanged.
  if (!clientPdfShareCapability) {
    clientPdfShareCapability = detectPdfShareCapability();
  }
  return clientPdfShareCapability;
}

function usePdfShareCapability(): PdfShareCapability {
  return useSyncExternalStore(
    subscribeNoop,
    getClientPdfShareCapability,
    () => SERVER_PDF_SHARE_CAPABILITY,
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function triggerAnchorDownload(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2_000);
}

export function PdfExportPanel({
  pdfUrl,
  filename,
  documentKind,
  documentId,
  documentLabel = "PDF",
  className,
  density = "comfortable",
}: PdfExportPanelProps) {
  const capability = usePdfShareCapability();
  const [busy, setBusy] = useState<BusyAction>(null);
  const [ready, setReady] = useState(false);
  const [byteSize, setByteSize] = useState<number | null>(null);
  const [lastSharedAt, setLastSharedAt] = useState<number | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [dockVisible, setDockVisible] = useState(false);
  const cacheRef = useRef<CacheEntry | null>(null);
  const cacheKeyRef = useRef(`${pdfUrl}::${filename}`);
  const fetchGenerationRef = useRef(0);
  const panelRef = useRef<HTMLElement | null>(null);
  const kindMeta = KIND_META[documentKind];
  const cacheKey = `${pdfUrl}::${filename}`;

  useEffect(() => {
    return () => {
      fetchGenerationRef.current += 1;
      if (cacheRef.current) {
        window.URL.revokeObjectURL(cacheRef.current.objectUrl);
      }
    };
  }, []);

  // Reset cached PDF when the document identity changes (no automatic prefetch —
  // generating PDFs eagerly contended with detail-page navigation in CI).
  useEffect(() => {
    if (cacheKeyRef.current === cacheKey) return;
    fetchGenerationRef.current += 1;
    if (cacheRef.current) {
      window.URL.revokeObjectURL(cacheRef.current.objectUrl);
      cacheRef.current = null;
    }
    cacheKeyRef.current = cacheKey;
    setReady(false);
    setByteSize(null);
    setShareLink(null);
  }, [cacheKey]);

  // Sticky mobile dock when the panel scrolls out of view (pass 1).
  useEffect(() => {
    const node = panelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setDockVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const ensurePdf = useCallback(async (): Promise<CacheEntry> => {
    if (cacheRef.current && cacheKeyRef.current === cacheKey) {
      return cacheRef.current;
    }

    const generation = ++fetchGenerationRef.current;
    const requestedKey = cacheKey;
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(pdfFetchErrorMessage(response.status));
    }

    const blob = await response.blob();
    // Ignore stale responses if the user navigated to another document mid-fetch.
    if (
      fetchGenerationRef.current !== generation ||
      cacheKeyRef.current !== requestedKey
    ) {
      throw new Error("PDF request was superseded. Try again.");
    }

    if (cacheRef.current) {
      window.URL.revokeObjectURL(cacheRef.current.objectUrl);
    }

    const objectUrl = window.URL.createObjectURL(blob);
    const entry = { blob, objectUrl };
    cacheRef.current = entry;
    setByteSize(blob.size);
    setReady(true);
    return entry;
  }, [cacheKey, pdfUrl]);

  const runAction = async (action: Exclude<BusyAction, null>, work: () => Promise<void>) => {
    if (busy) return;
    setBusy(action);
    try {
      await work();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
      console.error(`PDF ${action} failed:`, error);
    } finally {
      setBusy(null);
    }
  };

  const handleShare = () =>
    runAction("share", async () => {
      const { blob } = await ensurePdf();
      const file = toPdfFile(blob, filename);

      if (capability.canShareFiles && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share(buildPdfSharePayload(file));
          setLastSharedAt(Date.now());
          toast.success("Share sheet opened — pick Messages, Mail, Files, or AirDrop.");
          return;
        } catch (shareError) {
          if (isShareAbortError(shareError)) return;
        }
      }

      if (capability.prefersShareOverDownload) {
        window.open(
          cacheRef.current?.objectUrl ?? URL.createObjectURL(blob),
          "_blank",
          "noopener,noreferrer",
        );
        toast.message("Preview opened", {
          description:
            "Use the browser Share button (square with arrow) to send the PDF — Downloads alone often only preview on iPhone.",
        });
        return;
      }

      triggerAnchorDownload(blob, filename);
      toast.success("PDF downloaded.");
    });

  const handleDownload = () =>
    runAction("download", async () => {
      const { blob } = await ensurePdf();

      if (capability.isAppleTouch && capability.canShareFiles) {
        const file = toPdfFile(blob, filename);
        try {
          await navigator.share(buildPdfSharePayload(file));
          toast.success("Choose “Save to Files” in the share sheet.");
          return;
        } catch (shareError) {
          if (isShareAbortError(shareError)) return;
        }
      }

      triggerAnchorDownload(blob, filename);
      if (capability.isAppleTouch) {
        toast.message("If the PDF only opened for preview", {
          description: "Tap Share → Save to Files from the preview screen.",
        });
      } else {
        toast.success("PDF saved.");
      }
    });

  const handlePreview = () =>
    runAction("preview", async () => {
      const entry = await ensurePdf();
      const previewUrl = `${pdfUrl}${pdfUrl.includes("?") ? "&" : "?"}disposition=inline`;
      const opened = window.open(entry.objectUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.assign(previewUrl);
      }
    });

  const createShareLink = async (): Promise<string> => {
    if (shareLink) return shareLink;

    const response = await fetch("/api/pdf-share-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: documentKind, documentId }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || pdfFetchErrorMessage(response.status));
    }

    const payload = (await response.json()) as {
      url: string;
      expiresInDays: number;
    };
    setShareLink(payload.url);
    return payload.url;
  };

  const handleCopyLink = () =>
    runAction("link", async () => {
      const url = await createShareLink();
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied", {
        description: "Anyone with the link can download the PDF for 7 days — no login required.",
      });
    });

  const handleEmail = () =>
    runAction("email", async () => {
      const { blob } = await ensurePdf();
      const file = toPdfFile(blob, filename);

      if (capability.canShareFiles && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share(buildPdfSharePayload(file));
          toast.success("Pick Mail (or Gmail) in the share sheet to attach the PDF.");
          return;
        } catch (shareError) {
          if (isShareAbortError(shareError)) return;
        }
      }

      const url = await createShareLink();
      const subject = encodeURIComponent(`${documentLabel}: ${filename.replace(/\.pdf$/i, "")}`);
      const body = encodeURIComponent(
        `Hi,\n\nHere is the ${documentLabel.toLowerCase()} PDF:\n${url}\n\nThis link expires in 7 days.\n`,
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      toast.message("Email draft opened", {
        description: "The message includes a download link for the PDF.",
      });
    });

  const isBusy = busy !== null;
  const statusLabel = busy
    ? busy === "share"
      ? "Preparing share…"
      : busy === "download"
        ? "Saving…"
        : busy === "preview"
          ? "Opening preview…"
          : busy === "link"
            ? "Minting link…"
            : "Preparing email…"
    : ready
      ? lastSharedAt
        ? "Ready · recently shared"
        : "Ready to send"
      : "Tap an action to prepare";

  const shareLabel = capability.canShareFiles ? "Share PDF" : "Share / Send";

  return (
    <>
      <section
        ref={panelRef}
        className={cn(
          "pdf-export-panel relative overflow-hidden rounded-2xl border border-primary/20",
          "bg-[linear-gradient(152deg,rgba(255,255,255,0.96)_0%,rgba(236,245,238,0.82)_48%,rgba(248,246,238,0.9)_100%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_36px_-20px_rgba(44,98,64,0.55)]",
          "dark:border-white/12 dark:bg-[linear-gradient(152deg,rgba(18,26,20,0.96),rgba(28,42,32,0.84))]",
          "pdf-export-enter",
          density === "comfortable" ? "p-3.5 sm:p-4" : "p-2.5",
          className,
        )}
        aria-label={`${documentLabel} export`}
      >
        {/* Pass 1: canopy accent rail */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b",
            kindMeta.rail,
          )}
        />
        <div
          aria-hidden
          className="pdf-export-glow pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.08] dark:mix-blend-screen"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative pl-2">
          <div className="flex flex-wrap items-start justify-between gap-2.5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase ring-1",
                    kindMeta.tone,
                  )}
                >
                  {kindMeta.short}
                </span>
                <p className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Dispatch {documentLabel}
                </p>
              </div>
              {/* Pass 2: filename as stamped plate */}
              <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-black/5 bg-black/[0.03] px-2 py-1 dark:border-white/10 dark:bg-white/5">
                <FileArchive className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <p className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs" title={filename}>
                  {filename}
                </p>
                {byteSize != null ? (
                  <span className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-foreground/70 dark:bg-black/30">
                    {formatBytes(byteSize)}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                ready
                  ? "pdf-export-ready border-accent/35 bg-accent/12 text-[hsl(142_38%_22%)] dark:text-accent"
                  : "border-border/80 bg-white/55 text-muted-foreground dark:bg-white/5",
              )}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : ready ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <span className="relative flex size-3.5 items-center justify-center" aria-hidden>
                  <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/50" />
                  <span className="relative size-1.5 rounded-full bg-amber-500" />
                </span>
              )}
              <span>{statusLabel}</span>
            </div>
          </div>

          {/* Pass 2: warm-up meter */}
          <div
            className="mt-3 h-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={ready ? 100 : busy ? 65 : 25}
            aria-label="PDF preparation"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-700 ease-out",
                ready
                  ? "w-full bg-gradient-to-r from-[var(--brand-canopy)] to-[var(--brand-gold)]"
                  : "w-1/3 animate-pulse bg-gradient-to-r from-[var(--brand-straw)]/80 to-[var(--brand-canopy)]/70",
              )}
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1.45fr_1fr_1fr]">
            <Button
              type="button"
              className="h-12 w-full gap-2 text-base shadow-[0_8px_20px_-12px_rgba(44,98,64,0.8)] sm:h-11 sm:text-sm"
              onClick={handleShare}
              disabled={isBusy}
              data-icon="inline-start"
            >
              {busy === "share" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Share2 className="size-4" />
              )}
              {shareLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 border-white/80 bg-white/75 backdrop-blur-sm dark:border-white/15 dark:bg-white/5"
              onClick={handleDownload}
              disabled={isBusy}
              data-icon="inline-start"
            >
              {busy === "download" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 border-white/80 bg-white/75 backdrop-blur-sm dark:border-white/15 dark:bg-white/5"
              onClick={handlePreview}
              disabled={isBusy}
              data-icon="inline-start"
            >
              {busy === "preview" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Eye className="size-4" />
              )}
              Preview
            </Button>
          </div>

          {/* Pass 1/2: labeled utility rail */}
          <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-black/5 pt-2.5 dark:border-white/10">
            <span className="mr-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Send
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
              onClick={handleCopyLink}
              disabled={isBusy}
            >
              {busy === "link" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Link2 className="size-3.5" />
              )}
              {shareLink ? "Copy link again" : "Copy 7-day link"}
            </Button>
            <span className="hidden text-border sm:inline" aria-hidden>
              ·
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
              onClick={handleEmail}
              disabled={isBusy}
            >
              {busy === "email" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Mail className="size-3.5" />
              )}
              Email
            </Button>
          </div>

          {capability.isAppleTouch ? (
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
              On iPhone, <span className="font-medium text-foreground/85">Share PDF</span> opens the
              system sheet so you can send the file — not just preview it. Use Save → “Save to Files”
              when you need it offline.
            </p>
          ) : !capability.canShareFiles ? (
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
              This browser downloads files directly. Use{" "}
              <span className="font-medium text-foreground/85">Copy 7-day link</span> or{" "}
              <span className="font-medium text-foreground/85">Email</span> to send without attaching
              manually.
            </p>
          ) : null}
        </div>
      </section>

      {/* Pass 1/3: sticky mobile share dock when panel scrolls away */}
      <div
        className={cn(
          "pdf-export-dock fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-[hsl(60_8%_97%/0.92)] p-3 backdrop-blur-xl transition-transform duration-300 sm:hidden",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          dockVisible ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        aria-hidden={!dockVisible}
      >
        <Button
          type="button"
          className="h-12 w-full gap-2 text-base shadow-lg"
          onClick={handleShare}
          disabled={isBusy || !dockVisible}
          data-icon="inline-start"
        >
          {busy === "share" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Share2 className="size-4" />
          )}
          {shareLabel}
        </Button>
      </div>
    </>
  );
}
