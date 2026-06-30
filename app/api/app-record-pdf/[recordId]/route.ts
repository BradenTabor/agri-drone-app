import { type DocumentProps, renderToStream } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { type NextRequest } from "next/server";

import { AppRecordPdf } from "@/lib/pdf/AppRecordPdf";
import { getAppRecordForPdf } from "@/lib/pdf/getAppRecordForPdf";
import { appRecordPdfFilename } from "@/lib/pdf/pdfFilename";
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

  const data = await getAppRecordForPdf(recordId, supabase);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const document = createElement(AppRecordPdf, { data }) as ReactElement<DocumentProps>;
  const stream = await renderToStream(document);
  const filename = appRecordPdfFilename(data.record.job_date, recordId);

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
