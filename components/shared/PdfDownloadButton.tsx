"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type PdfDownloadButtonProps = {
  pdfUrl: string;
  filename: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
};

const PDF_MIME = "application/pdf";

/**
 * Probe whether this browser can share PDF files via the Web Share API.
 * (iOS Safari + installed PWA, Android Chrome). Desktop browsers generally
 * cannot, so they fall back to a normal download.
 */
function canSharePdf(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    const probe = new File(["%PDF-1.4"], "probe.pdf", { type: PDF_MIME });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

// Capability detection is a client-only concern; `useSyncExternalStore` lets us
// read it without triggering a hydration mismatch (server snapshot is `false`).
const noopSubscribe = () => () => {};

function useCanSharePdf(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => canSharePdf(),
    () => false,
  );
}

export function PdfDownloadButton({
  pdfUrl,
  filename,
  variant = "outline",
  className,
}: PdfDownloadButtonProps) {
  const [isBusy, setIsBusy] = useState(false);
  const shareSupported = useCanSharePdf();

  const downloadBlob = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  };

  const handleClick = async () => {
    setIsBusy(true);
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`PDF request failed with status ${response.status}`);
      }

      // Force the correct MIME type so iOS treats the attachment as a PDF
      // (and renders a first-page thumbnail) instead of application/octet-stream.
      const rawBlob = await response.blob();
      const pdfBlob =
        rawBlob.type === PDF_MIME ? rawBlob : new Blob([rawBlob], { type: PDF_MIME });

      if (shareSupported) {
        const file = new File([pdfBlob], filename, { type: PDF_MIME });
        if (navigator.canShare({ files: [file] })) {
          try {
            // Share ONLY the file. We intentionally omit `url`/`text`/`title`
            // so the share sheet does not attach the app link alongside the PDF.
            await navigator.share({ files: [file] });
            return;
          } catch (shareError) {
            // The user dismissing the share sheet is not an error.
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
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const idleLabel = shareSupported ? "Share PDF" : "Download PDF";
  const busyLabel = shareSupported ? "Preparing…" : "Downloading…";

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
