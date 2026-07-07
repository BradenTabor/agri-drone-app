import { BRAND } from "@/lib/brand";

/**
 * Branded metadata embedded in a PDF's info dictionary. This is what a viewer
 * shows under "Properties" / "Get Info", what iOS/macOS use as the document
 * title, and what makes a shared file attributable to the brand once it leaves
 * the app. `author` is always the brand.
 */
export type PdfDocumentMeta = {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  keywords: string;
};

/** Join descriptor parts (customer, date, ...) into a single readable string. */
function joinDescriptor(parts: Array<string | null | undefined>): string | null {
  const cleaned = parts
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter((part) => part.length > 0);
  return cleaned.length > 0 ? cleaned.join(" \u2014 ") : null;
}

/**
 * Build branded PDF metadata for a document. The title leads with the brand so
 * it reads as e.g. "Aerial Technology Solutions Mix Record — Sample Farm — 2026-06-11".
 */
export function buildPdfDocumentMeta(input: {
  documentLabel: string;
  descriptor?: string | null;
}): PdfDocumentMeta {
  const descriptor = input.descriptor?.trim() || null;
  const title = descriptor
    ? `${BRAND.name} ${input.documentLabel} \u2014 ${descriptor}`
    : `${BRAND.name} ${input.documentLabel}`;
  const application = `${BRAND.appName} (${BRAND.name})`;

  return {
    title,
    author: BRAND.name,
    subject: `${input.documentLabel} \u2014 ${BRAND.name}`,
    creator: application,
    producer: application,
    keywords: [BRAND.name, BRAND.shortName, input.documentLabel].join(", "),
  };
}

export function mixRecordPdfMeta(input: {
  customerName?: string | null;
  fieldName?: string | null;
  recordDate?: string | null;
}): PdfDocumentMeta {
  return buildPdfDocumentMeta({
    documentLabel: "Mix Record",
    descriptor: joinDescriptor([input.customerName, input.fieldName, input.recordDate]),
  });
}

export function appRecordPdfMeta(input: {
  customerName?: string | null;
  jobDate?: string | null;
}): PdfDocumentMeta {
  return buildPdfDocumentMeta({
    documentLabel: "Application Record",
    descriptor: joinDescriptor([input.customerName, input.jobDate]),
  });
}

export function quotePdfMeta(input: {
  quoteNumber?: string | null;
  customerName?: string | null;
  quoteDate?: string | null;
}): PdfDocumentMeta {
  return buildPdfDocumentMeta({
    documentLabel: "Quote",
    descriptor: joinDescriptor([input.quoteNumber, input.customerName, input.quoteDate]),
  });
}
