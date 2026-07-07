import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BRAND } from "@/lib/brand";
import {
  appRecordPdfMeta,
  buildPdfDocumentMeta,
  mixRecordPdfMeta,
  quotePdfMeta,
} from "@/lib/pdf/documentMeta";

const EM_DASH = "\u2014";

describe("buildPdfDocumentMeta", () => {
  it("uses the brand as author and a brand-led title", () => {
    const meta = buildPdfDocumentMeta({ documentLabel: "Mix Record" });
    assert.equal(meta.author, BRAND.name);
    assert.equal(meta.title, `${BRAND.name} Mix Record`);
  });

  it("appends the descriptor to the title when provided", () => {
    const meta = buildPdfDocumentMeta({
      documentLabel: "Mix Record",
      descriptor: "Sample Farm",
    });
    assert.equal(meta.title, `${BRAND.name} Mix Record ${EM_DASH} Sample Farm`);
  });

  it("treats a blank descriptor as absent", () => {
    const meta = buildPdfDocumentMeta({ documentLabel: "Quote", descriptor: "   " });
    assert.equal(meta.title, `${BRAND.name} Quote`);
  });

  it("sets brand-attributable creator/producer and keywords", () => {
    const meta = buildPdfDocumentMeta({ documentLabel: "Quote" });
    const application = `${BRAND.appName} (${BRAND.name})`;
    assert.equal(meta.creator, application);
    assert.equal(meta.producer, application);
    assert.equal(meta.subject, `Quote ${EM_DASH} ${BRAND.name}`);
    assert.ok(meta.keywords.includes(BRAND.name));
    assert.ok(meta.keywords.includes(BRAND.shortName));
  });
});

describe("document-specific metadata", () => {
  it("mix record joins customer, field, and date into the descriptor", () => {
    const meta = mixRecordPdfMeta({
      customerName: "Sample Farm LLC",
      fieldName: "North 40",
      recordDate: "2026-06-11",
    });
    assert.equal(meta.author, BRAND.name);
    assert.equal(
      meta.title,
      `${BRAND.name} Mix Record ${EM_DASH} Sample Farm LLC ${EM_DASH} North 40 ${EM_DASH} 2026-06-11`,
    );
  });

  it("application record joins customer and job date", () => {
    const meta = appRecordPdfMeta({ customerName: "Acme Farms", jobDate: "2026-06-19" });
    assert.equal(
      meta.title,
      `${BRAND.name} Application Record ${EM_DASH} Acme Farms ${EM_DASH} 2026-06-19`,
    );
  });

  it("quote joins quote number, customer, and date", () => {
    const meta = quotePdfMeta({
      quoteNumber: "Q-1042",
      customerName: "Sample Farm LLC",
      quoteDate: "2026-06-11",
    });
    assert.equal(
      meta.title,
      `${BRAND.name} Quote ${EM_DASH} Q-1042 ${EM_DASH} Sample Farm LLC ${EM_DASH} 2026-06-11`,
    );
  });

  it("omits missing descriptor parts gracefully", () => {
    const meta = mixRecordPdfMeta({ customerName: null, fieldName: null, recordDate: null });
    assert.equal(meta.title, `${BRAND.name} Mix Record`);
  });
});
