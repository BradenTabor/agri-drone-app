import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
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

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const bodySchema = z.object({
  kind: z.union([
    z.literal("mix_record"),
    z.literal("app_record"),
    z.literal("quote"),
  ]),
  documentId: z.string().uuid(),
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

  const kind = parsed.data.kind as PdfDocumentKind;
  let buffer: Buffer;
  let filename: string;

  try {
    const built = await buildPdfDocument(kind, parsed.data.documentId, supabase);
    if (!built) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    filename = built.filename;
    buffer = await renderBuiltPdfToBuffer(built);
  } catch (error) {
    console.error("pdf share render failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not create share link" }, { status: 500 });
  }

  const token = randomUUID();
  const storagePath = `${user.id}/${token}.pdf`;
  const expiresAt = new Date(Date.now() + SHARE_TTL_SECONDS * 1000);

  const { error: uploadError } = await supabase.storage
    .from("pdf-exports")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("pdf share upload failed:", uploadError.message);
    return NextResponse.json({ error: "Could not create share link" }, { status: 500 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("pdf-exports")
    .createSignedUrl(storagePath, SHARE_TTL_SECONDS, {
      download: filename,
    });

  if (signError || !signed?.signedUrl) {
    console.error("pdf share sign failed:", signError?.message);
    await supabase.storage.from("pdf-exports").remove([storagePath]);
    return NextResponse.json({ error: "Could not create share link" }, { status: 500 });
  }

  // Audit metadata only — revoke requires deleting the storage object; signed
  // URLs remain valid until TTL even if revoked_at is set later.
  const { error: insertError } = await supabase.from("document_share_links").insert({
    user_id: user.id,
    document_kind: kind,
    document_id: parsed.data.documentId,
    storage_path: storagePath,
    filename,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    console.error("pdf share metadata insert failed:", insertError.message);
  }

  return NextResponse.json({
    url: signed.signedUrl,
    filename,
    expiresAt: expiresAt.toISOString(),
    expiresInDays: 7,
  });
}
