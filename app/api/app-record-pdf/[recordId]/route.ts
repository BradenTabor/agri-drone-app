import { type NextRequest } from "next/server";

import { buildPdfDocument, renderBuiltPdfToStream } from "@/lib/pdf/buildPdfDocument";
import { pdfResponseHeaders } from "@/lib/pdf/pdfHttp";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ recordId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { recordId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const built = await buildPdfDocument("app_record", recordId, supabase);
  if (!built) {
    return new Response("Not found", { status: 404 });
  }

  const disposition =
    request.nextUrl.searchParams.get("disposition") === "inline" ? "inline" : "attachment";
  const stream = await renderBuiltPdfToStream(built);

  return new Response(stream as unknown as ReadableStream, {
    headers: pdfResponseHeaders(built.filename, disposition),
  });
}
