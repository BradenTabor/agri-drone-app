import { type DocumentProps, renderToStream } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { type NextRequest } from "next/server";

import { getMixRecordForPdf } from "@/lib/pdf/getMixRecordForPdf";
import { MixRecordPdf } from "@/lib/pdf/MixRecordPdf";
import { mixRecordPdfFilename } from "@/lib/pdf/pdfFilename";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ recordId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { recordId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await getMixRecordForPdf(recordId, supabase);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const document = createElement(MixRecordPdf, { data }) as ReactElement<DocumentProps>;
  const stream = await renderToStream(document);
  const filename = mixRecordPdfFilename({
    customerName: data.record.customer_name_snapshot,
    recordDate: data.record.record_date,
    id: recordId,
  });

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
