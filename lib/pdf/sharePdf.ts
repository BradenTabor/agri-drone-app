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
