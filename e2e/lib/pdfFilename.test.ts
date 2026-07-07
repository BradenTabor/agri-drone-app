import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BRAND } from "@/lib/brand";
import {
  appRecordPdfFilename,
  buildPdfFilename,
  mixRecordPdfFilename,
  quotePdfFilename,
  sanitizeFilenamePart,
} from "@/lib/pdf/pdfFilename";

const ID = "c2d42c9f-fd01-4a42-96e7-93cef32acb16";

describe("sanitizeFilenamePart", () => {
  it("keeps letters, numbers, spaces, hyphens, and underscores", () => {
    assert.equal(sanitizeFilenamePart("Sample Farm LLC"), "Sample Farm LLC");
    assert.equal(sanitizeFilenamePart("North-40_East"), "North-40_East");
  });

  it("replaces unsafe characters and collapses whitespace", () => {
    assert.equal(sanitizeFilenamePart("Bob's Farm / Co."), "Bob s Farm Co");
    assert.equal(sanitizeFilenamePart("a\t\n  b"), "a b");
  });

  it("folds diacritics to ASCII", () => {
    assert.equal(sanitizeFilenamePart("Górski Niño"), "Gorski Nino");
  });

  it("returns an empty string when nothing usable remains", () => {
    assert.equal(sanitizeFilenamePart("///"), "");
    assert.equal(sanitizeFilenamePart("   "), "");
  });

  it("caps a single segment length", () => {
    const result = sanitizeFilenamePart("x".repeat(200));
    assert.ok(result.length <= 60, `expected <= 60, got ${result.length}`);
  });
});

describe("buildPdfFilename", () => {
  it("leads with the brand short name and ends in .pdf", () => {
    const name = buildPdfFilename(["Mix Record", "Sample Farm LLC", "2026-06-11"]);
    assert.equal(name, `${BRAND.shortName} Mix Record Sample Farm LLC 2026-06-11.pdf`);
  });

  it("drops empty/blank/nullish parts", () => {
    assert.equal(
      buildPdfFilename(["Quote", null, undefined, "", "  ", "2026-06-11"]),
      `${BRAND.shortName} Quote 2026-06-11.pdf`,
    );
  });

  it("strips path and scheme separators so a filename can't be a URL/path", () => {
    const name = buildPdfFilename(["Quote", "https://example.com/x", "a\\b/c"]);
    assert.ok(!name.includes("/"), name);
    assert.ok(!name.includes("\\"), name);
    assert.ok(!name.includes(":"), name);
  });

  it("falls back to a sensible base when all parts are empty", () => {
    const name = buildPdfFilename([null, "", "   "]);
    assert.equal(name, `${BRAND.shortName}.pdf`);
  });
});

describe("mixRecordPdfFilename", () => {
  it("includes the customer name and record date", () => {
    assert.equal(
      mixRecordPdfFilename({ customerName: "Sample Farm LLC", recordDate: "2026-06-11", id: ID }),
      `${BRAND.shortName} Mix Record Sample Farm LLC 2026-06-11.pdf`,
    );
  });

  it("falls back to the short id when the date is missing", () => {
    assert.equal(
      mixRecordPdfFilename({ customerName: null, recordDate: null, id: ID }),
      `${BRAND.shortName} Mix Record ${ID.slice(0, 8)}.pdf`,
    );
  });
});

describe("appRecordPdfFilename", () => {
  it("includes the customer name and job date", () => {
    assert.equal(
      appRecordPdfFilename({ customerName: "Acme Farms", jobDate: "2026-06-19", id: ID }),
      `${BRAND.shortName} Application Record Acme Farms 2026-06-19.pdf`,
    );
  });
});

describe("quotePdfFilename", () => {
  it("includes quote number, customer, and date", () => {
    assert.equal(
      quotePdfFilename({
        quoteNumber: "Q-1042",
        customerName: "Sample Farm LLC",
        quoteDate: "2026-06-11",
        id: ID,
      }),
      `${BRAND.shortName} Quote Q-1042 Sample Farm LLC 2026-06-11.pdf`,
    );
  });

  it("falls back to the short id when number and date are missing", () => {
    assert.equal(
      quotePdfFilename({ quoteNumber: null, customerName: null, quoteDate: null, id: ID }),
      `${BRAND.shortName} Quote ${ID.slice(0, 8)}.pdf`,
    );
  });
});
