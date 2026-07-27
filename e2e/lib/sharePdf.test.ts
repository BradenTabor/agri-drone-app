import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPdfSharePayload,
  detectPdfShareCapability,
  PDF_MIME,
  pdfFetchErrorMessage,
  toPdfBlob,
} from "@/lib/pdf/sharePdf";
import { pdfContentDisposition } from "@/lib/pdf/pdfHttp";

const fakeFile = { name: "ATS Quote.pdf", type: PDF_MIME } as unknown as File;

describe("buildPdfSharePayload", () => {
  it("shares the file and nothing else", () => {
    const payload = buildPdfSharePayload(fakeFile);
    assert.deepEqual(Object.keys(payload), ["files"]);
    assert.equal(payload.files.length, 1);
    assert.equal(payload.files[0], fakeFile);
  });

  it("never includes a url, text, or title (no app link in the share sheet)", () => {
    const payload = buildPdfSharePayload(fakeFile) as Record<string, unknown>;
    assert.equal("url" in payload, false);
    assert.equal("text" in payload, false);
    assert.equal("title" in payload, false);
  });
});

describe("toPdfBlob", () => {
  it("retypes octet-stream blobs as application/pdf", () => {
    const input = new Blob(["%PDF"], { type: "application/octet-stream" });
    assert.equal(toPdfBlob(input).type, PDF_MIME);
  });
});

describe("detectPdfShareCapability", () => {
  it("returns false capability when navigator is missing", () => {
    const capability = detectPdfShareCapability(null);
    assert.equal(capability.canShareFiles, false);
    assert.equal(capability.prefersShareOverDownload, false);
  });

  it("prefers share-over-download only on Apple touch devices", () => {
    const desktopWithShare = {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      maxTouchPoints: 0,
      canShare: () => true,
      share: async () => {},
    } as unknown as Pick<Navigator, "canShare" | "share" | "userAgent" | "maxTouchPoints">;

    const capability = detectPdfShareCapability(desktopWithShare);
    assert.equal(capability.canShareFiles, true);
    assert.equal(capability.prefersShareOverDownload, false);
  });
});

describe("pdfFetchErrorMessage", () => {
  it("maps auth and not-found statuses", () => {
    assert.match(pdfFetchErrorMessage(401), /Sign in/i);
    assert.match(pdfFetchErrorMessage(404), /not found/i);
  });
});

describe("pdfContentDisposition", () => {
  it("includes filename and filename*", () => {
    const header = pdfContentDisposition("ATS Mix Record Sample Farm.pdf", "attachment");
    assert.match(header, /^attachment;/);
    assert.match(header, /filename="/);
    assert.match(header, /filename\*=UTF-8''/);
  });
});
