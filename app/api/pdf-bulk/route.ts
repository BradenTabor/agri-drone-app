import { NextResponse, type NextRequest } from "next/server";
import JSZip from "jszip";
import { z } from "zod";

import {
  buildPdfDocument,
  type PdfDocumentKind,
  renderBuiltPdfToBuffer,
} from "@/lib/pdf/buildPdfDocument";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BULK_ITEMS = 25;

const itemSchema = z.object({
  kind: z.union([
    z.literal("mix_record"),
    z.literal("app_record"),
    z.literal("quote"),
  ]),
  documentId: z.string().uuid(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(MAX_BULK_ITEMS),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  let added = 0;
  let skipped = 0;

  for (const item of parsed.data.items) {
    try {
      const kind = item.kind as PdfDocumentKind;
      // Bulk ZIP omits photo appendix to keep memory/time bounded.
      const built = await buildPdfDocument(kind, item.documentId, supabase, {
        includePhotos: false,
      });
      if (!built) {
        skipped += 1;
        continue;
      }

      let name = built.filename;
      if (usedNames.has(name)) {
        const stem = name.replace(/\.pdf$/i, "");
        name = `${stem}-${item.documentId.slice(0, 8)}.pdf`;
      }
      usedNames.add(name);

      const buffer = await renderBuiltPdfToBuffer(built);
      zip.file(name, buffer);
      added += 1;
    } catch (error) {
      skipped += 1;
      console.error("pdf-bulk item failed:", {
        kind: item.kind,
        documentId: item.documentId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  if (added === 0) {
    return NextResponse.json({ error: "No documents available to export" }, { status: 404 });
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `ATS PDF Export ${stamp}.zip`;

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Pdf-Added": String(added),
      "X-Pdf-Skipped": String(skipped),
    },
  });
}
