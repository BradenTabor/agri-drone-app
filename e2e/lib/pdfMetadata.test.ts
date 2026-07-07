import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { BRAND } from "@/lib/brand";
import { AppRecordPdf } from "@/lib/pdf/AppRecordPdf";
import type { AppRecordPdfData } from "@/lib/pdf/getAppRecordForPdf";
import type { MixRecordPdfData } from "@/lib/pdf/getMixRecordForPdf";
import type { QuotePdfData } from "@/lib/pdf/getQuoteForPdf";
import { MixRecordPdf } from "@/lib/pdf/MixRecordPdf";
import { QuotePdf } from "@/lib/pdf/QuotePdf";

const INFO_KEYS = ["Title", "Author", "Subject", "Creator", "Producer", "Keywords"] as const;

/**
 * Decode a PDF literal string object body. `@react-pdf/renderer` writes ASCII
 * info strings as PDFDocEncoding literals and non-ASCII ones (e.g. anything with
 * an em dash) as UTF-16BE with a `FE FF` byte-order mark.
 */
function decodePdfString(raw: Buffer): string {
  if (raw.length >= 2 && raw[0] === 0xfe && raw[1] === 0xff) {
    const body = raw.subarray(2);
    const units: number[] = [];
    for (let i = 0; i + 1 < body.length; i += 2) {
      units.push((body[i] << 8) | body[i + 1]);
    }
    return String.fromCharCode(...units);
  }
  return raw.toString("latin1");
}

/** Resolve the string referenced by an info-dictionary key (e.g. `/Author N 0 R`). */
function readInfoString(buffer: Buffer, key: string): string | null {
  const latin1 = buffer.toString("latin1");
  const ref = latin1.match(new RegExp(`/${key}\\s+(\\d+)\\s+0\\s+R`));
  if (!ref) return null;
  const objStart = latin1.indexOf(`\n${ref[1]} 0 obj`);
  if (objStart < 0) return null;
  const open = latin1.indexOf("(", objStart);
  if (open < 0) return null;
  let close = -1;
  for (let i = open + 1; i < latin1.length; i += 1) {
    if (latin1[i] === "\\") {
      i += 1; // skip escaped char
      continue;
    }
    if (latin1[i] === ")") {
      close = i;
      break;
    }
  }
  if (close < 0) return null;
  return decodePdfString(buffer.subarray(open + 1, close));
}

function render(element: ReactElement<DocumentProps>): Promise<Buffer> {
  return renderToBuffer(element);
}

function makeMixData(): MixRecordPdfData {
  return {
    record: {
      id: "00000000-0000-0000-0000-000000000001",
      record_date: "2026-06-11",
      time_mixed: "08:30",
      customer_name_snapshot: "Sample Farm LLC",
      field_name_snapshot: "North 40",
      applicator_name_override: null,
      applicator_display_name: "Austin Tabor",
      license_cert_no: "AR-12345",
      equipment_identifier: "DJI T40",
      mix_lat: 36.123456,
      mix_lng: -93.654321,
      tank_size_gal: 10,
      target_gpa: 2,
      water_gal: 8.5,
      surfactant_name: null,
      surfactant_amount: null,
      surfactant_unit: null,
      total_mix_gal: 10,
      expected_acres: 50,
      actual_acres: null,
      wind_speed_mph: 6,
      wind_direction: "SW",
      temp_f: 72,
      humidity_pct: 55,
      notes: null,
      signed_typed_name: "Austin Tabor",
      signature_attested: true,
      submitted_at: "2026-06-11T14:30:00.000Z",
      submitted_by_name: "Austin Tabor",
      last_modified_at: null,
      last_modified_by_name: null,
    },
    productLines: [],
    photoCount: 0,
  };
}

function makeQuoteData(): QuotePdfData {
  return {
    quote: {
      id: "00000000-0000-0000-0000-0000000000c1",
      quote_number: "Q-1042",
      status: "sent",
      quote_date: "2026-06-11",
      valid_until: null,
      customer_name: "Sample Farm LLC",
      service_for: null,
      acres: 50,
      adjuvant_name: null,
      adjuvant_price: null,
      mileage: null,
      notes: null,
      terms: null,
      subtotal: 100,
      tax_rate: 0,
      other_label: null,
      other_amount: 0,
      total: 100,
    },
    customer: {
      name: "Sample Farm LLC",
      contact_name: null,
      email: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      zip: null,
    },
    lineItems: [
      {
        kind: "custom",
        description: "Aerial application",
        basis: "per_acre",
        quantity: 50,
        unit_price: 2,
        amount: 100,
      },
    ],
  };
}

function makeAppData(): AppRecordPdfData {
  return {
    record: {
      id: "00000000-0000-0000-0000-0000000000aa",
      job_date: "2026-06-19",
      applicator_name: "Jane Applicator",
      customer_name: "Acme Farms",
      site_address: null,
      job_site_id: null,
      location_lat: null,
      location_lng: null,
      temp_f: null,
      wind_speed_mph: null,
      wind_direction: null,
      sky_condition: null,
      target_vegetation: ["brush"],
      target_veg_other: null,
      app_method: null,
      app_type: null,
      start_time: null,
      end_time: null,
      total_gallons: null,
      gallons_per_acre: null,
      acres_treated: null,
      tank_mix_record: null,
      equipment_notes: null,
      truck_id: null,
      nozzle_type: null,
      rei: null,
      safe_reentry_date: null,
      additional_notes: null,
      cert_attested: true,
      applicator_sig: "Jane Applicator",
      license_cert_no: null,
      submitted_at: "2026-06-19T14:30:00.000Z",
      submitted_by_name: "Jane Applicator",
      last_modified_at: null,
      last_modified_by_name: null,
    },
    pesticides: [
      {
        is_surfactant: false,
        epa_reg_number: "524-549",
        product_name: "Roundup PowerMax 3",
        active_ingredient: "Glyphosate",
      },
    ],
    linkedMixRecords: [],
    linkedMixRecordDocs: [],
  };
}

const cases = [
  {
    label: "Mix Record",
    element: () => createElement(MixRecordPdf, { data: makeMixData() }) as ReactElement<DocumentProps>,
    titleContains: ["Mix Record", "Sample Farm LLC", "2026-06-11"],
  },
  {
    label: "Quote",
    element: () => createElement(QuotePdf, { data: makeQuoteData() }) as ReactElement<DocumentProps>,
    titleContains: ["Quote", "Q-1042", "Sample Farm LLC"],
  },
  {
    label: "Application Record",
    element: () => createElement(AppRecordPdf, { data: makeAppData() }) as ReactElement<DocumentProps>,
    titleContains: ["Application Record", "Acme Farms", "2026-06-19"],
  },
] as const;

describe("branded PDF metadata", () => {
  for (const testCase of cases) {
    it(`embeds brand author and title for ${testCase.label}`, async () => {
      const buffer = await render(testCase.element());

      assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");

      const latin1 = buffer.toString("latin1");
      for (const key of INFO_KEYS) {
        assert.ok(latin1.includes(`/${key}`), `expected info dictionary to include /${key}`);
      }

      const author = readInfoString(buffer, "Author");
      assert.equal(author, BRAND.name, "author should be the brand");

      const title = readInfoString(buffer, "Title");
      assert.ok(title, "expected a title string");
      assert.ok(title!.startsWith(BRAND.name), `title should lead with brand, got: ${title}`);
      for (const fragment of testCase.titleContains) {
        assert.ok(title!.includes(fragment), `title should include "${fragment}", got: ${title}`);
      }
    });
  }
});
