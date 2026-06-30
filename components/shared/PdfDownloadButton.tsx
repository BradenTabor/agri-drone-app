"use client";

import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type PdfDownloadButtonProps = {
  pdfUrl: string;
  filename: string;
  /**
   * Human-readable title used as the share-sheet title on mobile.
   * Intentionally never used as a URL so the app link is not attached
   * to the shared message.
   */
  shareTitle?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

// File-sharing capability is a static property of the device/browser, so we
// detect it once and cache it. Reading it through useSyncExternalStore keeps
// rendering SSR-safe (the server always reports `false`).
let cachedCanShareFiles: boolean | null = null;

function detectCanShareFiles(): boolean {
  if (cachedCanShareFiles !== null) return cachedCanShareFiles;
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    cachedCanShareFiles = false;
    return cachedCanShareFiles;
  }
  try {
    const probe = new File([new Blob([], { type: "application/pdf" })], "probe.pdf", {
      type: "application/pdf",
    });
    cachedCanShareFiles = navigator.canShare({ files: [probe] });
  } catch {
    cachedCanShareFiles = false;
  }
  return cachedCanShareFiles;
}

function subscribeToNothing(): () => void {
  return () => {};
}

function useCanShareFiles(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => detectCanShareFiles(),
    () => false,
  );
}

async function fetchPdfFile(pdfUrl: string, filename: string): Promise<File> {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF (${response.status})`);
  }
  const blob = await response.blob();
  return new File([blob], filename, { type: "application/pdf" });
}

function triggerBrowserDownload(file: File, filename: string) {
  const url = window.URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

export function PdfDownloadButton({
  pdfUrl,
  filename,
  shareTitle,
  variant = "outline",
  className,
}: PdfDownloadButtonProps) {
  const [isBusy, setIsBusy] = useState(false);
  const canShareFiles = useCanShareFiles();

  const handleClick = async () => {
    setIsBusy(true);
    try {
      const file = await fetchPdfFile(pdfUrl, filename);

      if (canShareFiles && navigator.canShare?.({ files: [file] })) {
        try {
          // Share ONLY the file. We deliberately omit `url` and `text` so
          // the messaging app does not attach a link back to the web app.
          await navigator.share({
            files: [file],
            title: shareTitle ?? filename,
          });
          return;
        } catch (error) {
          if (isAbortError(error)) {
            // User dismissed the share sheet; do nothing further.
            return;
          }
          // Fall back to a plain download if sharing is unavailable at runtime.
          triggerBrowserDownload(file, filename);
          return;
        }
      }

      triggerBrowserDownload(file, filename);
    } catch (error) {
      console.error("Failed to prepare PDF:", error);
      alert("Failed to prepare the PDF. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const idleLabel = canShareFiles ? "Share PDF" : "Download PDF";
  const busyLabel = canShareFiles ? "Preparing..." : "Downloading...";

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
