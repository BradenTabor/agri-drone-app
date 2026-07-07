import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPdfSharePayload, PDF_MIME } from "@/lib/pdf/sharePdf";

// The Web Share `File` type is structural here; we only need an object to pass
// through, so a minimal stub keeps the test free of DOM/File-constructor needs.
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
