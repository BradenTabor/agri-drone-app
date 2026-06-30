import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { decimalToDms, dmsToString } from "@/lib/formatting/coordinates";
import { BRAND } from "@/lib/brand";

import { BrandPdfHeader, brandPdfMetaStyles } from "./BrandPdfHeader";
import type { MixRecordPdfData } from "./getMixRecordForPdf";
import { PDF_THEME } from "./theme";

const EM_DASH = "—";

const styles = StyleSheet.create({
  page: {
    paddingTop: `${PDF_THEME.spacing.pageMarginMm}mm`,
    paddingBottom: `${PDF_THEME.spacing.pageMarginMm}mm`,
    paddingHorizontal: `${PDF_THEME.spacing.pageMarginMm}mm`,
    fontFamily: PDF_THEME.fonts.body,
    fontSize: PDF_THEME.typography.bodyPt,
    color: PDF_THEME.colors.foreground,
    backgroundColor: PDF_THEME.colors.background,
    lineHeight: 1.35,
  },
  runningHeader: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
    marginBottom: 8,
  },
  title: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.titlePt,
    marginBottom: 6,
  },
  subtitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: PDF_THEME.spacing.sectionGapPt,
  },
  subtitleText: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
  },
  subtitleValue: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.foreground,
  },
  section: {
    marginBottom: PDF_THEME.spacing.sectionGapPt,
  },
  sectionTitle: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.sectionLabelPt,
    color: PDF_THEME.colors.muted,
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: PDF_THEME.colors.divider,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: PDF_THEME.spacing.fieldGapPt,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
    marginBottom: 1,
  },
  value: {
    fontSize: PDF_THEME.typography.bodyPt,
    color: PDF_THEME.colors.foreground,
  },
  fullWidthBlock: {
    marginBottom: PDF_THEME.spacing.fieldGapPt,
  },
  productsBlock: {
    marginTop: 4,
  },
  productItem: {
    marginBottom: 6,
  },
  productName: {
    fontFamily: PDF_THEME.fonts.bold,
  },
  notesValue: {
    whiteSpace: "pre-wrap",
  },
  certificationRow: {
    marginBottom: PDF_THEME.spacing.fieldGapPt,
  },
  footerRow: {
    position: "absolute",
    left: `${PDF_THEME.spacing.pageMarginMm}mm`,
    right: `${PDF_THEME.spacing.pageMarginMm}mm`,
    bottom: `${PDF_THEME.spacing.pageMarginMm / 2}mm`,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: PDF_THEME.colors.divider,
    paddingTop: 6,
  },
  footerText: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
  },
});

function valueOrDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return EM_DASH;
  }
  return String(value);
}

function formatRecordId(recordId: string): string {
  return recordId.slice(0, 8);
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return EM_DASH;
  const date = new Date(timestamp);
  if (Number.isNaN(date.valueOf())) return timestamp;
  return date.toISOString().replace("T", " ").slice(0, 16);
}

function formatCoordinate(decimal: number, axis: "lat" | "lng"): string {
  const rounded = decimal.toFixed(6);
  const hemisphere = axis === "lat" ? (decimal < 0 ? "S" : "N") : decimal < 0 ? "W" : "E";
  try {
    const dms = dmsToString(decimalToDms(decimal, axis));
    return `${rounded}° ${hemisphere} (${dms})`;
  } catch {
    return `${rounded}°`;
  }
}

function formatProductRate(ratePerAcre: number | null, rateUnit: string | null): string {
  if (ratePerAcre === null || !rateUnit) return EM_DASH;
  return `${ratePerAcre} ${rateUnit}/ac`;
}

function HeaderSection({ data }: { data: MixRecordPdfData }) {
  const { record } = data;

  return (
    <View style={styles.section} wrap={false}>
      <BrandPdfHeader documentTitle="Mix Record">
        <Text style={brandPdfMetaStyles.docMeta}>
          Record ID: <Text style={brandPdfMetaStyles.docMetaValue}>{formatRecordId(record.id)}</Text>
        </Text>
        <Text style={brandPdfMetaStyles.docMeta}>
          Generated: <Text style={brandPdfMetaStyles.docMetaValue}>{new Date().toISOString().slice(0, 10)}</Text>
        </Text>
      </BrandPdfHeader>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{valueOrDash(record.record_date)}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.label}>Time Mixed</Text>
          <Text style={styles.value}>{valueOrDash(record.time_mixed)}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Applicator</Text>
          <Text style={styles.value}>{valueOrDash(record.applicator_display_name)}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.label}>Equipment</Text>
          <Text style={styles.value}>{valueOrDash(record.equipment_identifier)}</Text>
        </View>
      </View>

      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>License/Cert #</Text>
        <Text style={styles.value}>{valueOrDash(record.license_cert_no)}</Text>
      </View>

      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{valueOrDash(record.customer_name_snapshot)}</Text>
      </View>

      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Field</Text>
        <Text style={styles.value}>{valueOrDash(record.field_name_snapshot)}</Text>
      </View>

      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Latitude</Text>
        <Text style={styles.value}>{formatCoordinate(record.mix_lat, "lat")}</Text>
      </View>
      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Longitude</Text>
        <Text style={styles.value}>{formatCoordinate(record.mix_lng, "lng")}</Text>
      </View>
    </View>
  );
}

function MixSection({ data }: { data: MixRecordPdfData }) {
  const { record, productLines } = data;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>MIX</Text>
      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Tank Size</Text>
          <Text style={styles.value}>{record.tank_size_gal} gal</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.label}>Target GPA</Text>
          <Text style={styles.value}>{record.target_gpa}</Text>
        </View>
      </View>

      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Water</Text>
        <Text style={styles.value}>{record.water_gal} gal</Text>
      </View>

      <View style={styles.productsBlock}>
        <Text style={styles.label}>Products</Text>
        {(productLines.length ? productLines : [null]).map((line, index) => (
          <View key={line ? `${line.product_name ?? "product"}-${index}` : "empty-product"} style={styles.productItem}>
            <Text style={[styles.value, styles.productName]}>
              {index + 1}) {line?.product_name ?? "Unlinked product"} (EPA {line?.epa_number ?? EM_DASH})
            </Text>
            <Text style={styles.value}>
              {line ? `${line.amount_added} ${line.amount_unit} added at ${formatProductRate(line.rate_per_acre, line.rate_unit)}` : EM_DASH}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Surfactant</Text>
        <Text style={styles.value}>
          {record.surfactant_name
            ? `${record.surfactant_name} — ${valueOrDash(record.surfactant_amount)} ${valueOrDash(record.surfactant_unit)}`
            : EM_DASH}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Total Mix</Text>
          <Text style={styles.value}>{record.total_mix_gal} gal</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.label}>Expected Acres</Text>
          <Text style={styles.value}>{record.expected_acres}</Text>
        </View>
      </View>

      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Actual Acres</Text>
        <Text style={styles.value}>{valueOrDash(record.actual_acres)}</Text>
      </View>
    </View>
  );
}

function ConditionsSection({ data }: { data: MixRecordPdfData }) {
  const { record } = data;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>CONDITIONS</Text>
      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Wind</Text>
          <Text style={styles.value}>
            {record.wind_speed_mph} mph {record.wind_direction}
          </Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.label}>Temperature</Text>
          <Text style={styles.value}>
            {record.temp_f !== null ? `${record.temp_f}°F` : EM_DASH}
          </Text>
        </View>
      </View>

      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Humidity</Text>
        <Text style={styles.value}>
          {record.humidity_pct !== null ? `${record.humidity_pct}%` : EM_DASH}
        </Text>
      </View>
    </View>
  );
}

function NotesSection({ notes }: { notes: string | null }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>NOTES</Text>
      <View style={styles.divider} />
      <Text style={[styles.value, styles.notesValue]}>{valueOrDash(notes)}</Text>
    </View>
  );
}

function CertificationSection({ data }: { data: MixRecordPdfData }) {
  const { record, photoCount } = data;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>CERTIFICATION</Text>
      <View style={styles.divider} />

      <View style={styles.certificationRow}>
        <Text style={styles.label}>Signed</Text>
        <Text style={styles.value}>{valueOrDash(record.signed_typed_name)}</Text>
      </View>

      <View style={styles.certificationRow}>
        <Text style={styles.label}>Attested</Text>
        <Text style={styles.value}>{record.signature_attested ? "Yes" : "No"}</Text>
      </View>

      <View style={styles.certificationRow}>
        <Text style={styles.label}>Submitted</Text>
        <Text style={styles.value}>
          {formatTimestamp(record.submitted_at)} by {valueOrDash(record.submitted_by_name)}
        </Text>
      </View>

      <View style={styles.certificationRow}>
        <Text style={styles.label}>Last modified</Text>
        <Text style={styles.value}>{formatTimestamp(record.last_modified_at)}</Text>
      </View>

      <View style={styles.certificationRow}>
        <Text style={styles.label}>Photos on record</Text>
        <Text style={styles.value}>{photoCount}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footerRow} fixed>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      <Text style={styles.footerText}>{BRAND.name} — Mix Record</Text>
    </View>
  );
}

export function MixRecordPage({ data }: { data: MixRecordPdfData }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.runningHeader} fixed>
        {BRAND.name} — Mix Record
      </Text>
      <HeaderSection data={data} />
      <MixSection data={data} />
      <ConditionsSection data={data} />
      <NotesSection notes={data.record.notes} />
      <CertificationSection data={data} />
      <Footer />
    </Page>
  );
}

export function MixRecordPdf({ data }: { data: MixRecordPdfData }) {
  return (
    <Document>
      <MixRecordPage data={data} />
    </Document>
  );
}
