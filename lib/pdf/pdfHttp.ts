/**
 * Shared HTTP helpers for PDF API responses.
 * Keeps Content-Disposition consistent across mix / app / quote routes.
 */

export type PdfDisposition = "attachment" | "inline";

/**
 * Build a Content-Disposition header with both ASCII `filename` and
 * RFC 5987 `filename*` so mobile share sheets and desktop browsers get a
 * usable name even when the branded filename has spaces or unicode.
 */
export function pdfContentDisposition(
  filename: string,
  disposition: PdfDisposition = "attachment",
): string {
  const asciiFallback = filename
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename).replace(/['()]/g, escape);
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export function pdfResponseHeaders(
  filename: string,
  disposition: PdfDisposition = "attachment",
): HeadersInit {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": pdfContentDisposition(filename, disposition),
    "Cache-Control": "no-store",
  };
}
