import { BRAND } from "@/lib/brand";

/**
 * Branded metadata applied to every generated PDF `<Document>`.
 *
 * This metadata is what PDF viewers, file managers, and messaging apps read to
 * display the document's identity (title, author, producer). Setting it makes
 * shared files clearly attributable to the business rather than showing a blank
 * or generic title.
 */
export type PdfDocumentMeta = {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
};

export function brandedDocumentMeta(args: {
  documentType: string;
  reference?: string | null;
}): PdfDocumentMeta {
  const referenceSuffix = args.reference ? ` ${args.reference}` : "";
  return {
    title: `${BRAND.name} ${args.documentType}${referenceSuffix}`.trim(),
    author: BRAND.name,
    subject: `${args.documentType} from ${BRAND.name}`,
    keywords: [BRAND.name, BRAND.shortName, args.documentType].join(", "),
    creator: BRAND.appName,
    producer: BRAND.appName,
  };
}
