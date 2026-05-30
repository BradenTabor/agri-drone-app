# Mix Record PDF Export — Build Spec

> This document is the source of truth for the Mix Record PDF export feature. Defers to `agri_drone_app_build_plan.md` for stack decisions and global patterns. Cursor should read both before starting.

---

## 1. Scope

Generate a single-page (occasionally two-page), brand-neutral, compliance-ready PDF for a single mix record, fetched on demand via a Next.js API route. Triggered from the "Download PDF" button on the record detail page.

**In scope:**

- One API route: `app/api/pdf/[recordId]/route.ts`
- One React component for the PDF document: `lib/pdf/MixRecordPdf.tsx` (uses `@react-pdf/renderer`)
- Wire the existing "Download PDF" button on `app/(app)/records/[id]/page.tsx` to this route
- Theme tokens centralized in `lib/pdf/theme.ts` so a future brand swap touches one file

**Out of scope:**

- Bulk PDF export (deferred per Q43)
- Email or shareable-link delivery (deferred per Q42/Q44)
- Customer-facing branded HTML view (deferred per Q44)
- Compliance-template-per-state (deferred per Q31/Q32)
- Logo, colors, or fonts beyond the default industrial ag-tech theme (per Q58 — TBD later)

---

## 2. Dependencies

Add to `package.json`:

```json
"@react-pdf/renderer": "^4.x"
```

`@react-pdf/renderer` renders React components to PDFs server-side without a headless browser. Pure JS, no Chromium dependency, works fine on Vercel's Node runtime.

No new database migrations. No new RLS policies. The route reads through existing tables using the standard server client; RLS already enforces who can see what.

---

## 3. Architecture

```
User clicks "Download PDF" on /records/[id]
   ↓
Browser navigates to /api/pdf/[recordId]
   ↓
Route handler:
  1. Auth check (getUser → 401 if missing)
  2. Fetch mix_record + joined data (product lines, photos count, customer/field snapshots)
  3. If record missing or soft-deleted → 404
  4. Render MixRecordPdf React tree to PDF stream
  5. Return as application/pdf with Content-Disposition: inline
   ↓
Browser displays PDF inline (user can save/print from there)
```

**Why inline, not attachment:** lets the user preview before saving, and matches modern browser PDF UX. If the user wants to save, the browser's built-in PDF viewer has the download button. Setting `attachment` would force a download dialog every time, which is hostile to "I just want to look at this record."

---

## 4. Data Model

The route fetches the same data the detail page already fetches, but in one consolidated query path. Single source of truth: a helper function `getMixRecordForPdf(id, supabase)` that returns:

```ts
type MixRecordPdfData = {
  record: {
    id: string;
    record_date: string;
    time_mixed: string;
    customer_name_snapshot: string | null;
    field_name_snapshot: string | null;
    applicator_name_override: string | null;
    applicator_display_name: string | null; // override > applicator profile > null
    license_cert_no: string | null;
    equipment_identifier: string | null;  // resolved from equipment_id join
    mix_lat: number;
    mix_lng: number;
    tank_size_gal: number;
    target_gpa: number;
    water_gal: number;
    surfactant_name: string | null;
    surfactant_amount: number | null;
    surfactant_unit: string | null;
    total_mix_gal: number;
    expected_acres: number;
    actual_acres: number | null;
    wind_speed_mph: number;
    wind_direction: string;
    temp_f: number | null;
    humidity_pct: number | null;
    notes: string | null;
    signed_typed_name: string;
    signature_attested: boolean;
    submitted_at: string;
    submitted_by_name: string | null;  // resolved from submitted_by → profiles.full_name
    last_modified_at: string | null;
    last_modified_by_name: string | null;  // resolved likewise
  };
  productLines: Array<{
    product_name: string | null;
    epa_number: string | null;
    amount_added: number;
    amount_unit: string;
    rate_per_acre: number | null;
    rate_unit: string | null;
  }>;
  photoCount: number;
};
```

The helper lives at `lib/pdf/getMixRecordForPdf.ts`. Two reasons it's separate from the route handler:

1. Testable in isolation if we ever add unit tests
2. Future "bulk export" feature in Phase 2 can reuse it without copying the join logic

**Snapshot fields are the source of truth for display.** If the customer was renamed after this record was filed, the PDF still shows the original name. That's intentional — compliance records reflect the state at filing time.

---

## 5. Layout — Page 1 (always)

Recognizable structure of the original paper form, modernized.

```
┌──────────────────────────────────────────────────────────────┐
│  TANK-MIX & CALIBRATION RECORD                               │
│  Record ID: <last 8 of UUID>      Generated: <ISO date>      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Date: <record_date>           Time Mixed: <time_mixed>      │
│  Applicator: <name>            Truck/Sprayer: <equipment>    │
│  License/Cert #: <license_cert_no>                           │
│                                                              │
│  Job/Site:    <customer_name_snapshot>                       │
│  Field:       <field_name_snapshot>                          │
│                                                              │
│  Location:                                                   │
│    Latitude:  36.371206° N  (36° 22' 16.34" N)               │
│    Longitude: -93.293539° W (93° 17' 36.74" W)               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  MIX                                                         │
│                                                              │
│  Tank Size: 150 gal       Target GPA: 3.0 gal                │
│  Water:     125 gal                                          │
│                                                              │
│  Products:                                                   │
│    1) <product_name> (EPA <epa>)                             │
│         12.5 gal added at 32 oz/ac                           │
│    2) <product_name> (EPA <epa>)                             │
│         10.5 gal added at 28 oz/ac                           │
│                                                              │
│  Surfactant: <name> — <amount> <unit>                        │
│                                                              │
│  Total Mix: 150 gal      Expected Acres: 50                  │
│  Actual Acres: <or "—">                                      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  CONDITIONS                                                  │
│                                                              │
│  Wind: 8 mph NW          Temperature: 78°F                   │
│  Humidity: 45%                                               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  NOTES                                                       │
│                                                              │
│  <notes wrapped to width; if empty, shows "—">               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  CERTIFICATION                                               │
│                                                              │
│  Signed:    <signed_typed_name>                              │
│  Attested:  Yes / No                                         │
│                                                              │
│  Submitted: <submitted_at> by <submitted_by_name>            │
│  Last modified: <last_modified_at or "—">                    │
│  Photos on record: <photoCount>                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
       Page 1 of 1                                  Footer text
```

### Layout rules

- **A4 portrait** as the standard. (Letter size is acceptable too — pick A4 in the spec for international compatibility, since `@react-pdf/renderer` defaults to A4.)
- **20mm margins** on all sides.
- **Single column** for the body. Avoid two-column layouts — they wrap badly when data is short.
- **Section dividers**: thin horizontal rule, no header bars. Section names in small uppercase (e.g. `MIX`, `CONDITIONS`).
- **Field labels** in muted gray, values in solid foreground color. Same visual hierarchy as the detail page.
- **Coordinates**: show both decimal degrees and DMS, parenthesized. Matches Q16 "store decimal, display either" — and the PDF shows both because we don't know which the reader prefers.
- **Empty optional fields** render as `—` (em dash), not "N/A" or empty. Consistent with the detail page.

---

## 6. Layout — Page 2 (only if needed)

Page 2 is **only generated when notes wrap beyond the page-1 budget or when more than ~4 product lines exist.** The PDF generator handles this automatically via `@react-pdf/renderer`'s page-break logic if you structure the document with `<Page>` and `<View wrap>` correctly.

If page 2 is generated, it contains only the overflow content (extra product lines, long notes). A small header repeats: `TANK-MIX & CALIBRATION RECORD — <record_date> — Page 2 of 2`.

**No photos on page 2 in V1.** Photos are stored, photoCount is reported, but the PDF doesn't embed them. Reasons:

- Embedding photos balloons file size (10MB PDFs are unusable)
- Signed-URL fetching adds latency and complexity to the route
- Photos are visible on the web detail page; the PDF is the compliance record

Add to `PHASE_2_POLISH.md`: "Optional photo appendix on Mix Record PDF — embed downsampled previews when photoCount > 0."

---

## 7. Theme Tokens

`lib/pdf/theme.ts`:

```ts
export const PDF_THEME = {
  colors: {
    foreground: "#1A1F1B",      // near-black with green undertone
    muted: "#5E6360",            // muted gray for field labels
    accent: "#2F5D3F",           // deep field green for accents (page header rule)
    divider: "#D6D6D2",          // section dividers
    background: "#FFFFFF",       // white page
  },
  fonts: {
    // Use built-in fonts only in V1 — no custom font loading
    body: "Helvetica",
    bold: "Helvetica-Bold",
  },
  spacing: {
    pageMarginMm: 20,
    sectionGapPt: 14,
    fieldGapPt: 4,
  },
  typography: {
    titlePt: 18,
    sectionLabelPt: 10,
    bodyPt: 10,
    smallPt: 8,
  },
} as const;
```

**Why built-in fonts only:** `@react-pdf/renderer` supports custom font registration via URLs, but each adds bundle size and a network fetch at render time. Helvetica is universally available, looks clean, and matches the "professionally generic" target. When brand assets arrive (Q58), the brand font swaps in here.

---

## 8. Route Handler

`app/api/pdf/[recordId]/route.ts`:

```ts
import { renderToStream } from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMixRecordForPdf } from "@/lib/pdf/getMixRecordForPdf";
import { MixRecordPdf } from "@/lib/pdf/MixRecordPdf";

export const runtime = "nodejs";  // not "edge" — @react-pdf/renderer needs node
export const dynamic = "force-dynamic";  // never cache the PDF

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const { recordId } = await params;
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Fetch data
  const data = await getMixRecordForPdf(recordId, supabase);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  // 3. Render
  const stream = await renderToStream(<MixRecordPdf data={data} />);

  // 4. Return
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="mix-record-${data.record.record_date}-${recordId.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
```

**Filename format**: `mix-record-2026-05-21-a3f9b2c1.pdf`. Date first so files sort chronologically when saved in bulk.

**Cache-Control: no-store**: PDFs reflect live data (last-modified fields, etc.). Never cache.

**Note on `renderToStream` return type**: `@react-pdf/renderer` returns a Node `Readable` stream. The `as unknown as ReadableStream` cast is necessary because Next.js's Response constructor expects a Web `ReadableStream`. This works at runtime — Node 18+ streams are compatible with the Web Streams API — but TypeScript doesn't know that. The cast is a known wart of this library. Don't try to "fix" it with a polyfill.

---

## 9. MixRecordPdf Component

`lib/pdf/MixRecordPdf.tsx` is a normal React component, but uses `@react-pdf/renderer`'s primitives instead of HTML:

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PDF_THEME } from "./theme";
import { decimalToDms, dmsToString } from "@/lib/formatting/coordinates";
import type { MixRecordPdfData } from "./getMixRecordForPdf";

const styles = StyleSheet.create({
  page: {
    paddingTop: `${PDF_THEME.spacing.pageMarginMm}mm`,
    paddingBottom: `${PDF_THEME.spacing.pageMarginMm}mm`,
    paddingHorizontal: `${PDF_THEME.spacing.pageMarginMm}mm`,
    fontFamily: PDF_THEME.fonts.body,
    fontSize: PDF_THEME.typography.bodyPt,
    color: PDF_THEME.colors.foreground,
    backgroundColor: PDF_THEME.colors.background,
  },
  title: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.titlePt,
    marginBottom: 8,
  },
  // ... other styles
});

export function MixRecordPdf({ data }: { data: MixRecordPdfData }) {
  const { record, productLines, photoCount } = data;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header record={record} />
        <SectionDivider />
        <MixSection record={record} productLines={productLines} />
        <SectionDivider />
        <ConditionsSection record={record} />
        <SectionDivider />
        <NotesSection notes={record.notes} />
        <SectionDivider />
        <CertificationSection record={record} photoCount={photoCount} />
      </Page>
    </Document>
  );
}

// Subcomponents (Header, MixSection, etc.) defined in the same file
// Keep each one small and focused. The component is read once, never edited
// in flight — readability matters more than DRY here.
```

### Layout primitives you'll use

- `<Document>` — root
- `<Page>` — one per physical page
- `<View>` — block element (flex by default)
- `<Text>` — text node
- `StyleSheet.create({})` — produces style objects you pass via `style={styles.x}`

### Useful Flexbox patterns

`@react-pdf/renderer` uses flexbox-only layout, no grid. Common patterns:

- Two-column row: `<View style={{ flexDirection: "row" }}>` with children styled `flex: 1`
- Label + value pair: `<View style={{ flexDirection: "row" }}><Text style={{ width: 100, color: muted }}>Label:</Text><Text>Value</Text></View>`
- Page-break-safe block: wrap long content in `<View wrap>` (default) or `<View wrap={false}>` for blocks that shouldn't split

### Pitfalls to avoid

- **No CSS units other than pt, mm, in, %.** No `px`, no `em`, no `rem`.
- **No `box-shadow`, no `border-radius` beyond a few pt.** Renders inconsistently.
- **No images via URL** in V1 (per §6 — photos not embedded).
- **No `<Link>`** unless you want it clickable; the link styling is bare.

---

## 10. Wiring the Download Button

Current detail page (`app/(app)/records/[id]/page.tsx`) already has Edit + Delete buttons. Add a third:

```tsx
<a
  href={`/api/pdf/${record.id}`}
  target="_blank"
  rel="noopener noreferrer"
  className={buttonVariants({ variant: "outline" })}
>
  Download PDF
</a>
```

**Why `<a>` and not `<Link>`:** Next.js `<Link>` is for app-internal navigation with client-side routing. The PDF route returns a binary stream; we want a fresh browser navigation that handles the PDF download/preview natively.

**Why `target="_blank"`:** opens the PDF in a new tab so the user keeps their record detail context. This is the standard browser PDF-preview pattern.

`rel="noopener noreferrer"` is standard hygiene for `target="_blank"` even though we control the destination.

---

## 11. Edge Cases

A list of cases the implementation must handle gracefully:

1. **Record with no product lines** — Shouldn't happen given the Zod schema requires at least one, but the PDF should render an empty list with `—` rather than crashing.
2. **Record with very long notes** (multi-paragraph, 2000+ chars) — Text wraps and overflows to page 2 automatically via `@react-pdf/renderer`'s default behavior.
3. **Record submitted by deleted user** — `submitted_by_name` is null. PDF shows `Submitted: <timestamp> by —` rather than failing.
4. **Record with both deleted and non-deleted product lines** — The PDF helper filters `.is("deleted_at", null)` on the join, so deleted lines are excluded.
5. **Record that was soft-deleted between detail page load and PDF download** — The helper's `.is("deleted_at", null)` on `mix_records` causes the helper to return null, route returns 404. User sees a 404 page. Acceptable.
6. **User logs out between detail page load and PDF download** — Route auth check returns 401 with plain text body. Browser shows the 401 page. User re-logs in, retries.
7. **Customer or field renamed since filing** — Snapshot fields show original name. By design.
8. **Coordinates out of range** (shouldn't happen due to schema validation) — `decimalToDms` throws; wrap the call in try/catch and fall back to showing decimal only.

---

## 12. Build Sequence

Suggested order with stop points for review:

1. **Install dependency** — `npm install @react-pdf/renderer`. Verify build still passes.
2. **Build the helper** — `lib/pdf/getMixRecordForPdf.ts` with the consolidated query. Returns the typed shape from §4. Verify it works by adding a temporary console.log to the detail page that calls it and logs the result.
3. **Build the theme file** — `lib/pdf/theme.ts`. Self-contained.
4. **Build MixRecordPdf component skeleton** — Just the `<Document>` and `<Page>` with the title and nothing else. Verify it renders to PDF by calling `renderToBuffer` in a Node script. (Or skip and just build the route in step 5 — your call.)
5. **Build the route handler** — `app/api/pdf/[recordId]/route.ts` per §8. Confirm it returns a valid PDF with just the title. Open in browser, see the page.
6. **Fill in the layout sections one at a time** — Header, then Mix, then Conditions, then Notes, then Certification. After each section, re-download and verify visually.
7. **Wire the Download PDF button** on the detail page per §10.
8. **Run through the edge cases in §11** — Try each one if you can produce the conditions.
9. **One final smoke test** — Generate a PDF for the test mix record from the original Word doc upload (the Widner/Combs record). The output should be recognizable to anyone who used the old form.

**Stop points for review:** after step 2 (the helper) and after step 6 (the layout). Send both files in one paste per stop. The route handler in step 5 is small enough to include with whichever review is nearest in time.

---

## 13. Acceptance Criteria

A PDF is correct if:

- It renders without errors for the canonical test record
- All non-null fields from the database appear in the PDF
- All null/missing fields render as `—`
- Coordinates show both decimal and DMS
- Section structure matches §5 layout
- The filename matches the §8 pattern
- It opens in Chrome, Safari, Firefox, and the iOS Safari preview without rendering issues
- Print preview at "Actual Size" produces a clean A4 page
- The file size is under 100KB (without embedded photos, well under)

---

## 14. Out of scope, but worth knowing

For when this comes up later:

- **Photos embedded** — `@react-pdf/renderer` supports `<Image src="https://..." />`. For our case, fetch the photo via signed URL server-side, pipe to a base64 data URL, embed. Adds latency proportional to photo count. Phase 2.
- **Custom font** — `Font.register({ family: 'Inter', src: '/fonts/Inter.ttf' })`. Adds bundle size. Wait for real brand assets.
- **Multi-record bulk export** — Phase 2 candidate. Render each in a separate `<Page>` block, or stream a zip of individual PDFs.
- **Compliance template variants** — Phase 2. Different US states have different mandatory disclosure language; would handle via a `templateVariant` prop with conditional sections.
- **Watermarking** — "DRAFT" or "VOID" watermark if the record is soft-deleted (admin-viewable only). Trivial to add — fixed `<Text>` with absolute positioning, low opacity, large size.

---

End of spec.
