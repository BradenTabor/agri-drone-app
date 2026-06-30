import { BRAND } from "@/lib/brand";

/**
 * Sanitize a single filename segment. Keeps it human-readable (spaces allowed)
 * while stripping characters that can break Content-Disposition headers or
 * confuse mobile share sheets.
 */
function sanitizeFilenamePart(value: string): string {
  return value
    .replace(/[^A-Za-z0-9 _-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a branded, human-readable PDF filename, e.g. "ATS Quote Q-1042.pdf".
 *
 * The filename is what recipients see in iMessage / email, so it doubles as
 * lightweight branding. It is shared via the same value the route advertises in
 * its Content-Disposition header so download and share paths stay consistent.
 */
export function buildPdfFilename(parts: Array<string | null | undefined>): string {
  const segments = [BRAND.shortName, ...parts]
    .map((part) => (part == null ? "" : sanitizeFilenamePart(String(part))))
    .filter((part) => part.length > 0);
  const base = segments.join(" ") || "Document";
  return `${base}.pdf`;
}

export function quotePdfFilename(quoteNumber: string | null, quoteId: string): string {
  return buildPdfFilename(["Quote", quoteNumber || quoteId.slice(0, 8)]);
}

export function mixRecordPdfFilename(recordDate: string | null, recordId: string): string {
  return buildPdfFilename(["Mix Record", recordDate || recordId.slice(0, 8)]);
}

export function appRecordPdfFilename(jobDate: string | null, recordId: string): string {
  return buildPdfFilename(["Application Record", jobDate || recordId.slice(0, 8)]);
}
