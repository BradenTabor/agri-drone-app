import { type DocumentProps, renderToStream } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { type NextRequest } from "next/server";

import { getQuoteForPdf } from "@/lib/pdf/getQuoteForPdf";
import { quotePdfFilename } from "@/lib/pdf/pdfFilename";
import { QuotePdf } from "@/lib/pdf/QuotePdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ quoteId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { quoteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const data = await getQuoteForPdf(quoteId, supabase);
  if (!data) return new Response("Not found", { status: 404 });

  const document = createElement(QuotePdf, { data }) as ReactElement<DocumentProps>;
  const stream = await renderToStream(document);
  const filename = quotePdfFilename({
    quoteNumber: data.quote.quote_number,
    customerName: data.customer?.name ?? data.quote.customer_name,
    quoteDate: data.quote.quote_date,
    id: quoteId,
  });

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
