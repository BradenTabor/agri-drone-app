/**
 * Helpers for sharing a generated PDF as a *file* via the Web Share API.
 *
 * The product requirement is to share the document itself — never an app URL —
 * so recipients get the branded PDF (with a first-page thumbnail on iOS) rather
 * than a link that requires logging in. These helpers keep that invariant
 * explicit and unit-testable, separate from the React component wiring.
 */

export const PDF_MIME = "application/pdf";

/**
 * The Web Share payload for a PDF. Intentionally only `files`: no `url`,
 * `text`, or `title`, so the OS share sheet never attaches the app link
 * alongside the document.
 */
export type PdfSharePayload = { files: File[] };

export type PdfShareCapability = {
  canShareFiles: boolean;
  /** True when running in a likely iOS Safari / PWA context. */
  isAppleTouch: boolean;
  /**
   * True when `a[download]` is unreliable (often opens a preview tab instead
   * of saving). On those platforms, prefer the share sheet → Files / Mail.
   */
  prefersShareOverDownload: boolean;
};

/**
 * Build the share payload for a PDF file. This is the single place that decides
 * what goes into the share sheet — and it is, by construction, file-only.
 */
export function buildPdfSharePayload(file: File): PdfSharePayload {
  return { files: [file] };
}

/**
 * Ensure a fetched blob is typed as `application/pdf`. Some environments hand
 * back `application/octet-stream`, which makes iOS show a generic file icon
 * instead of a PDF thumbnail and can break "open in" targets.
 */
export function toPdfBlob(blob: Blob): Blob {
  return blob.type === PDF_MIME ? blob : new Blob([blob], { type: PDF_MIME });
}

export function toPdfFile(blob: Blob, filename: string): File {
  return new File([toPdfBlob(blob)], filename, {
    type: PDF_MIME,
    lastModified: Date.now(),
  });
}

export function detectPdfShareCapability(
  nav: Pick<Navigator, "canShare" | "share" | "userAgent" | "maxTouchPoints"> | null | undefined =
    typeof navigator === "undefined" ? null : navigator,
): PdfShareCapability {
  if (!nav) {
    return { canShareFiles: false, isAppleTouch: false, prefersShareOverDownload: false };
  }

  const ua = nav.userAgent || "";
  const isAppleTouch =
    /iPad|iPhone|iPod/.test(ua) ||
    (nav.maxTouchPoints > 1 && /Macintosh/.test(ua));

  let canShareFiles = false;
  if (typeof nav.canShare === "function" && typeof nav.share === "function") {
    try {
      const probe = new File(["%PDF-1.7"], "probe.pdf", { type: PDF_MIME });
      canShareFiles = nav.canShare({ files: [probe] });
    } catch {
      canShareFiles = false;
    }
  }

  return {
    canShareFiles,
    isAppleTouch,
    // Only iOS treats `a[download]` as unreliable; desktop browsers with Web
    // Share should fall through to a real download when share fails.
    prefersShareOverDownload: isAppleTouch,
  };
}

export function pdfFetchErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return "Sign in again to export this PDF.";
    case 403:
      return "You do not have permission to export this document.";
    case 404:
      return "Document not found. It may have been deleted.";
    default:
      return `Could not prepare the PDF (${status}). Try again.`;
  }
}

export function isShareAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
