/**
 * Dev-only script to preview branded PDF output without auth.
 * Usage: npx tsx scripts/preview-brand-pdfs.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { MixRecordPdf } from "../lib/pdf/MixRecordPdf";
import { QuotePdf } from "../lib/pdf/QuotePdf";
import type { MixRecordPdfData } from "../lib/pdf/getMixRecordForPdf";
import type { QuotePdfData } from "../lib/pdf/getQuoteForPdf";

const mockMixRecord: MixRecordPdfData = {
  record: {
    id: "00000000-0000-0000-0000-000000000001",
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
    notes: "Sample compliance record for brand preview.",
    signed_typed_name: "Austin Tabor",
    signature_attested: true,
    submitted_at: "2026-06-11T14:30:00.000Z",
    submitted_by_name: "Austin Tabor",
    last_modified_at: "2026-06-11T14:30:00.000Z",
    last_modified_by_name: "Austin Tabor",
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

const mockQuote: QuotePdfData = {
  quote: {
    id: "00000000-0000-0000-0000-000000000002",
    quote_number: "Q-2026-001",
    status: "draft",
    quote_date: "2026-06-11T00:00:00.000Z",
    valid_until: "2026-07-11T00:00:00.000Z",
    customer_name: "Sample Farm LLC",
    service_for: "Aerial herbicide application — North 40",
    acres: 50,
    adjuvant_surfactant: "NIS 0.25% v/v",
    price_per_acre: 15,
    mileage: 42,
    subtotal: 1250,
    tax_rate: 0,
    other_amount: 0,
    other_label: null,
    total: 1250,
    notes: "Pricing includes mobilization and product handling.",
    terms: "Payment due within 30 days of service completion.",
  },
  customer: {
    name: "Sample Farm LLC",
    contact_name: "John Smith",
    email: "john@samplefarm.com",
    phone: "(870) 555-0100",
    address: "123 County Road 12",
    city: "Western Grove",
    state: "AR",
    zip: "72685",
  },
  lineItems: [
    {
      description: "Aerial application — per acre",
      basis: "per_acre",
      quantity: 50,
      unit_price: 25,
      amount: 1250,
      kind: "service",
    },
  ],
};

async function main() {
  const outDir = path.join(process.cwd(), ".tmp", "pdf-previews");
  const mixBuffer = await renderToBuffer(
    createElement(MixRecordPdf, { data: mockMixRecord }) as ReactElement<DocumentProps>,
  );
  const quoteBuffer = await renderToBuffer(
    createElement(QuotePdf, { data: mockQuote }) as ReactElement<DocumentProps>,
  );

  writeFileSync(path.join(outDir, "mix-record-brand-preview.pdf"), mixBuffer);
  writeFileSync(path.join(outDir, "quote-brand-preview.pdf"), quoteBuffer);

  console.log("Wrote PDF previews to", outDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
