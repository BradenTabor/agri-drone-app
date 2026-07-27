import { type DocumentProps, renderToBuffer, renderToStream } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { AppRecordPdf } from "@/lib/pdf/AppRecordPdf";
import { getAppRecordForPdf } from "@/lib/pdf/getAppRecordForPdf";
import { getMixRecordForPdf } from "@/lib/pdf/getMixRecordForPdf";
import { getQuoteForPdf } from "@/lib/pdf/getQuoteForPdf";
import { MixRecordPdf } from "@/lib/pdf/MixRecordPdf";
import {
  appRecordPdfFilename,
  mixRecordPdfFilename,
  quotePdfFilename,
} from "@/lib/pdf/pdfFilename";
import { QuotePdf } from "@/lib/pdf/QuotePdf";
import type { Database } from "@/types/database";

export type PdfDocumentKind = "mix_record" | "app_record" | "quote";

export type BuildPdfDocumentOptions = {
  /** When false, omit photo appendix content (bulk ZIP). Default true. */
  includePhotos?: boolean;
};

export type BuiltPdfDocument = {
  kind: PdfDocumentKind;
  documentId: string;
  filename: string;
  element: ReactElement<DocumentProps>;
};

export async function buildPdfDocument(
  kind: PdfDocumentKind,
  documentId: string,
  supabase: SupabaseClient<Database>,
  options: BuildPdfDocumentOptions = {},
): Promise<BuiltPdfDocument | null> {
  switch (kind) {
    case "mix_record": {
      const data = await getMixRecordForPdf(documentId, supabase, {
        includePhotos: options.includePhotos,
      });
      if (!data) return null;
      return {
        kind,
        documentId,
        filename: mixRecordPdfFilename({
          customerName: data.record.customer_name_snapshot,
          recordDate: data.record.record_date,
          id: documentId,
        }),
        element: createElement(MixRecordPdf, { data }) as ReactElement<DocumentProps>,
      };
    }
    case "app_record": {
      const data = await getAppRecordForPdf(documentId, supabase, {
        includePhotos: options.includePhotos,
      });
      if (!data) return null;
      return {
        kind,
        documentId,
        filename: appRecordPdfFilename({
          customerName: data.record.customer_name,
          jobDate: data.record.job_date,
          id: documentId,
        }),
        element: createElement(AppRecordPdf, { data }) as ReactElement<DocumentProps>,
      };
    }
    case "quote": {
      const data = await getQuoteForPdf(documentId, supabase);
      if (!data) return null;
      return {
        kind,
        documentId,
        filename: quotePdfFilename({
          quoteNumber: data.quote.quote_number,
          customerName: data.customer?.name ?? data.quote.customer_name,
          quoteDate: data.quote.quote_date,
          id: documentId,
        }),
        element: createElement(QuotePdf, { data }) as ReactElement<DocumentProps>,
      };
    }
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export async function renderBuiltPdfToBuffer(built: BuiltPdfDocument): Promise<Buffer> {
  return renderToBuffer(built.element);
}

export async function renderBuiltPdfToStream(built: BuiltPdfDocument) {
  return renderToStream(built.element);
}

export function pdfKindFromPathSegment(
  segment: "mix" | "app-record" | "quote" | string,
): PdfDocumentKind | null {
  switch (segment) {
    case "mix":
    case "mix_record":
      return "mix_record";
    case "app-record":
    case "app_record":
      return "app_record";
    case "quote":
      return "quote";
    default:
      return null;
  }
}
