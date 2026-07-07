"use client";

import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { buildPdfSharePayload, PDF_MIME, toPdfBlob } from "@/lib/pdf/sharePdf";

type PdfDownloadButtonProps = {
  pdfUrl: string;
  filename: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
};

/**
 * Whether this browser can share PDF *files* via the Web Share API — i.e. iOS
 * Safari, installed PWAs, and Android Chrome. Desktop browsers generally cannot
 * and fall back to a normal download.
 */
function canSharePdfFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    const probe = new File(["%PDF-1.7"], "probe.pdf", { type: PDF_MIME });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

// Capability detection is client-only. `useSyncExternalStore` lets us read it
// without a hydration mismatch: the server snapshot is always `false`, so the
// first client render matches the server, then React re-renders with the real
// value once mounted.
const subscribeNoop = () => () => {};

function useCanSharePdfFiles(): boolean {
  return useSyncExternalStore(subscribeNoop, canSharePdfFiles, () => false);
}

export function PdfDownloadButton({
  pdfUrl,
  filename,
  variant = "outline",
  className,
}: PdfDownloadButtonProps) {
  const [isBusy, setIsBusy] = useState(false);
  const canShare = useCanSharePdfFiles();

  const downloadBlob = (blob: Blob) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
  };

  const handleClick = async () => {
    setIsBusy(true);
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`PDF request failed (${response.status})`);
      }
      const pdfBlob = toPdfBlob(await response.blob());

      if (canShare) {
        const file = new File([pdfBlob], filename, { type: PDF_MIME });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            // Share the file ONLY (no url/text/title) so the share sheet never
            // attaches the app link alongside the PDF.
            await navigator.share(buildPdfSharePayload(file));
            return;
          } catch (shareError) {
            // Dismissing the share sheet is a normal user action, not an error.
            if (shareError instanceof DOMException && shareError.name === "AbortError") {
              return;
            }
            // Any other share failure falls through to a plain download.
          }
        }
      }

      downloadBlob(pdfBlob);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      window.alert("Could not open the PDF. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const idleLabel = canShare ? "Share PDF" : "Download PDF";
  const busyLabel = canShare ? "Preparing…" : "Downloading…";

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={isBusy}
    >
      {isBusy ? busyLabel : idleLabel}
    </Button>
  );
}
