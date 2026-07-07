import { BRAND } from "@/lib/brand";

/**
 * Branded, human-readable filenames for shared/downloaded PDFs.
 *
 * The filename is the first thing a recipient sees in iMessage / Mail / Files,
 * so it doubles as lightweight branding and must be descriptive (who + when).
 * The same value is advertised in the route's `Content-Disposition` header and
 * used by the client share/download path, so both stay in sync.
 */

/** Keep any single descriptor segment from blowing out the total filename. */
const MAX_SEGMENT_LENGTH = 60;

/**
 * Sanitize a single filename segment. Keeps it human-readable (letters, numbers,
 * spaces, hyphens, underscores) while stripping characters that can break
 * `Content-Disposition` headers or confuse mobile share sheets. Diacritics are
 * folded to ASCII so the name stays portable across devices and filesystems.
 *
 * Returns "" when nothing usable remains.
 */
export function sanitizeFilenamePart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // drop combining marks left behind by NFKD
    .replace(/[^A-Za-z0-9 _-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEGMENT_LENGTH)
    .trim();
}

/**
 * Build a branded PDF filename from ordered parts. The brand short name always
 * leads so files are recognizable; empty/blank parts are dropped. Always ends
 * in `.pdf`.
 *
 * @example
 * buildPdfFilename(["Mix Record", "Sample Farm LLC", "2026-06-11"])
 * // => "ATS Mix Record Sample Farm LLC 2026-06-11.pdf"
 */
export function buildPdfFilename(parts: Array<string | null | undefined>): string {
  const segments = [BRAND.shortName, ...parts]
    .map((part) => (part == null ? "" : sanitizeFilenamePart(String(part))))
    .filter((part) => part.length > 0);
  const base = segments.join(" ") || sanitizeFilenamePart(BRAND.shortName) || "Document";
  return `${base}.pdf`;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

/** Date first ensures chronological sorting when files are saved in bulk. */
export function mixRecordPdfFilename(input: {
  customerName?: string | null;
  recordDate?: string | null;
  id: string;
}): string {
  return buildPdfFilename([
    "Mix Record",
    input.customerName,
    input.recordDate || shortId(input.id),
  ]);
}

export function appRecordPdfFilename(input: {
  customerName?: string | null;
  jobDate?: string | null;
  id: string;
}): string {
  return buildPdfFilename([
    "Application Record",
    input.customerName,
    input.jobDate || shortId(input.id),
  ]);
}

export function quotePdfFilename(input: {
  quoteNumber?: string | null;
  customerName?: string | null;
  quoteDate?: string | null;
  id: string;
}): string {
  const reference = input.quoteNumber || null;
  const trailing = input.quoteDate || (reference ? null : shortId(input.id));
  return buildPdfFilename(["Quote", reference, input.customerName, trailing]);
}
