import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { AppRecordPdf } from "@/lib/pdf/AppRecordPdf";
import type { AppRecordPdfData } from "@/lib/pdf/getAppRecordForPdf";
import type { MixRecordPdfData } from "@/lib/pdf/getMixRecordForPdf";
import { MixRecordPdf } from "@/lib/pdf/MixRecordPdf";

/**
 * Counts physical pages in a rendered PDF buffer. Each page is emitted as a
 * `<< /Type /Page ... >>` object; the single page-tree node is `/Type /Pages`,
 * excluded via the negative lookahead.
 */
function countPdfPages(buffer: Buffer): number {
  const content = buffer.toString("latin1");
  return (content.match(/\/Type\s*\/Page(?![s])/g) ?? []).length;
}

function renderPdf(element: ReactElement<DocumentProps>): Promise<Buffer> {
  return renderToBuffer(element);
}

function makeMixRecordData(id: string): MixRecordPdfData {
  return {
    record: {
      id,
      record_date: "2026-06-11",
      time_mixed: "08:30",
      applicator_name_override: null,
      applicator_display_name: "Austin Tabor",
      equipment_identifier: "DJI T40 #2",
      license_cert_no: "AR-12345",
      customer_name_snapshot: "Sample Farm LLC",
      field_name_snapshot: "North 40",
      mix_lat: 36.123456,
      mix_lng: -93.654321,
      tank_size_gal: 10,
      target_gpa: 2,
      water_gal: 8.5,
      surfactant_name: "Non-Ionic Surfactant",
      surfactant_amount: 8,
      surfactant_unit: "oz",
      total_mix_gal: 10,
      expected_acres: 50,
      actual_acres: 48.5,
      wind_speed_mph: 6,
      wind_direction: "SW",
      temp_f: 72,
      humidity_pct: 55,
      notes: "Sample compliance record for embedding test.",
      signed_typed_name: "Austin Tabor",
      signature_attested: true,
      submitted_at: "2026-06-11T14:30:00.000Z",
      submitted_by_name: "Austin Tabor",
      last_modified_at: null,
      last_modified_by_name: null,
    },
    productLines: [
      {
        product_name: "Roundup PowerMax 3",
        epa_number: "524-549",
        amount_added: 32,
        amount_unit: "oz",
        rate_per_acre: 32,
        rate_unit: "oz",
      },
    ],
    photoCount: 2,
  };
}

function makeAppRecordData(opts: {
  summaryCount: number;
  docs: MixRecordPdfData[];
}): AppRecordPdfData {
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
    linkedMixRecords: Array.from({ length: opts.summaryCount }, (_, index) => ({
      record_date: "2026-06-11",
      customer_name: `Customer ${index + 1}`,
      field_name: `Field ${index + 1}`,
    })),
    linkedMixRecordDocs: opts.docs,
  };
}

describe("AppRecordPdf mix record embedding", () => {
  it("renders cleanly with no linked mix records and adds no embedded pages", async () => {
    const data = makeAppRecordData({ summaryCount: 0, docs: [] });
    const buffer = await renderPdf(
      createElement(AppRecordPdf, { data }) as ReactElement<DocumentProps>,
    );

    assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
    assert.ok(countPdfPages(buffer) >= 1, "expected at least one rendered page");
  });

  it("embeds the full page(s) of a single linked mix record", async () => {
    const mix = makeMixRecordData("00000000-0000-0000-0000-000000000001");
    const mixPages = countPdfPages(
      await renderPdf(createElement(MixRecordPdf, { data: mix }) as ReactElement<DocumentProps>),
    );
    assert.ok(mixPages >= 1, "expected the mix record to render at least one page");

    const baseline = await renderPdf(
      createElement(AppRecordPdf, {
        data: makeAppRecordData({ summaryCount: 1, docs: [] }),
      }) as ReactElement<DocumentProps>,
    );
    const embedded = await renderPdf(
      createElement(AppRecordPdf, {
        data: makeAppRecordData({ summaryCount: 1, docs: [mix] }),
      }) as ReactElement<DocumentProps>,
    );

    assert.equal(embedded.subarray(0, 5).toString("latin1"), "%PDF-");
    // Exactly the mix record's own page(s) are appended — no extra/blank pages.
    assert.equal(countPdfPages(embedded), countPdfPages(baseline) + mixPages);
  });

  it("embeds all linked mix records when multiple are linked", async () => {
    const mixA = makeMixRecordData("00000000-0000-0000-0000-00000000000a");
    const mixB = makeMixRecordData("00000000-0000-0000-0000-00000000000b");
    const mixPages = countPdfPages(
      await renderPdf(createElement(MixRecordPdf, { data: mixA }) as ReactElement<DocumentProps>),
    );

    const baseline = await renderPdf(
      createElement(AppRecordPdf, {
        data: makeAppRecordData({ summaryCount: 2, docs: [] }),
      }) as ReactElement<DocumentProps>,
    );
    const embedded = await renderPdf(
      createElement(AppRecordPdf, {
        data: makeAppRecordData({ summaryCount: 2, docs: [mixA, mixB] }),
      }) as ReactElement<DocumentProps>,
    );

    assert.equal(countPdfPages(embedded), countPdfPages(baseline) + 2 * mixPages);
  });
});
