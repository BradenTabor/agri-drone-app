import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { BRAND } from "@/lib/brand";

import { BrandPdfHeader, brandPdfMetaStyles } from "./BrandPdfHeader";
import { brandedDocumentMeta } from "./documentMeta";
import type { AppRecordPdfData } from "./getAppRecordForPdf";
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
  legalBlock: {
    marginBottom: PDF_THEME.spacing.sectionGapPt,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_THEME.colors.divider,
  },
  legalTitle: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.sectionLabelPt,
    marginBottom: 4,
  },
  legalText: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
    marginBottom: 2,
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
  notesValue: {
    whiteSpace: "pre-wrap",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PDF_THEME.colors.divider,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  tableCellType: { width: "22%" },
  tableCellEpa: { width: "18%" },
  tableCellProduct: { width: "30%" },
  tableCellIngredient: { width: "30%" },
  tableHeaderText: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
  },
  tableCellText: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.foreground,
  },
  mixItem: {
    marginBottom: 4,
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

function formatMethod(value: string | null): string {
  if (!value) return EM_DASH;
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAppType(value: string | null): string {
  if (!value) return EM_DASH;
  return value[0]?.toUpperCase() + value.slice(1);
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{valueOrDash(value)}</Text>
    </View>
  );
}

function HeaderSection({ data }: { data: AppRecordPdfData }) {
  const { record } = data;

  return (
    <View style={styles.section} wrap={false}>
      <BrandPdfHeader documentTitle="Application Record">
        <Text style={brandPdfMetaStyles.docMeta}>
          Record ID: <Text style={brandPdfMetaStyles.docMetaValue}>{formatRecordId(record.id)}</Text>
        </Text>
        <Text style={brandPdfMetaStyles.docMeta}>
          Generated: <Text style={brandPdfMetaStyles.docMetaValue}>{new Date().toISOString().slice(0, 10)}</Text>
        </Text>
      </BrandPdfHeader>

      <View style={styles.legalBlock}>
        <Text style={styles.legalTitle}>COMMERCIAL HERBICIDE APPLICATION RECORD</Text>
        <Text style={styles.legalText}>(Required by State & Federal Law - Retain 3 Years)</Text>
        <Text style={styles.legalText}>Aerial Technology Solutions LLC | License #57275</Text>
        <Text style={styles.legalText}>{BRAND.address}</Text>
        <Text style={styles.legalText}>
          {BRAND.phone} | {BRAND.email}
        </Text>
      </View>
    </View>
  );
}

function JobSection({ data }: { data: AppRecordPdfData }) {
  const { record } = data;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>JOB INFORMATION</Text>
      <View style={styles.divider} />
      <View style={styles.row}>
        <FieldRow label="Job date" value={record.job_date} />
        <FieldRow label="Applicator" value={record.applicator_name} />
        <FieldRow label="Customer" value={record.customer_name} />
      </View>
      <View style={styles.row}>
        <FieldRow label="Site address" value={record.site_address} />
        <FieldRow label="Job/Site ID" value={record.job_site_id} />
        <View style={styles.column} />
      </View>
    </View>
  );
}

function GpsWeatherSection({ data }: { data: AppRecordPdfData }) {
  const { record } = data;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>GPS & WEATHER</Text>
      <View style={styles.divider} />
      <View style={styles.row}>
        <FieldRow label="Latitude" value={record.location_lat} />
        <FieldRow label="Longitude" value={record.location_lng} />
        <FieldRow label="Temp (F)" value={record.temp_f} />
      </View>
      <View style={styles.row}>
        <FieldRow label="Wind speed (mph)" value={record.wind_speed_mph} />
        <FieldRow label="Wind direction" value={record.wind_direction} />
        <FieldRow label="Sky condition" value={record.sky_condition} />
      </View>
    </View>
  );
}

function ApplicationSection({ data }: { data: AppRecordPdfData }) {
  const { record } = data;
  const targetVegetation = record.target_vegetation.join(", ") || EM_DASH;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>APPLICATION</Text>
      <View style={styles.divider} />
      <View style={styles.row}>
        <FieldRow label="Target vegetation" value={targetVegetation} />
        <FieldRow label="Other vegetation" value={record.target_veg_other} />
        <FieldRow label="Method" value={formatMethod(record.app_method)} />
      </View>
      <View style={styles.row}>
        <FieldRow label="Application type" value={formatAppType(record.app_type)} />
        <FieldRow label="Start time" value={record.start_time} />
        <FieldRow label="End time" value={record.end_time} />
      </View>
    </View>
  );
}

function MixRecordsSection({ linkedMixRecords }: { linkedMixRecords: AppRecordPdfData["linkedMixRecords"] }) {
  if (linkedMixRecords.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>MIX RECORDS</Text>
      <View style={styles.divider} />
      {linkedMixRecords.map((mix, index) => (
        <View key={`${mix.record_date}-${index}`} style={styles.mixItem}>
          <Text style={styles.value}>
            {mix.record_date} · {valueOrDash(mix.customer_name)} — {valueOrDash(mix.field_name)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PesticidesSection({ pesticides }: { pesticides: AppRecordPdfData["pesticides"] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>PESTICIDES</Text>
      <View style={styles.divider} />
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.tableCellType]}>Type</Text>
        <Text style={[styles.tableHeaderText, styles.tableCellEpa]}>EPA Reg #</Text>
        <Text style={[styles.tableHeaderText, styles.tableCellProduct]}>Product Name</Text>
        <Text style={[styles.tableHeaderText, styles.tableCellIngredient]}>Active Ingredient</Text>
      </View>
      {(pesticides.length ? pesticides : [null]).map((line, index) => (
        <View key={line ? `${line.product_name}-${index}` : "empty-pesticide"} style={styles.tableRow}>
          <Text style={[styles.tableCellText, styles.tableCellType]}>
            {line ? (line.is_surfactant ? "Surfactant/Adjuvant" : "Product") : EM_DASH}
          </Text>
          <Text style={[styles.tableCellText, styles.tableCellEpa]}>{valueOrDash(line?.epa_reg_number)}</Text>
          <Text style={[styles.tableCellText, styles.tableCellProduct]}>{valueOrDash(line?.product_name)}</Text>
          <Text style={[styles.tableCellText, styles.tableCellIngredient]}>
            {valueOrDash(line?.active_ingredient)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TotalsSection({ data }: { data: AppRecordPdfData }) {
  const { record } = data;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>TOTALS, EQUIPMENT, AND CERTIFICATION</Text>
      <View style={styles.divider} />
      <View style={styles.row}>
        <FieldRow label="Total gallons" value={record.total_gallons} />
        <FieldRow label="Gallons per acre" value={record.gallons_per_acre} />
        <FieldRow label="Acres treated" value={record.acres_treated} />
      </View>
      <View style={styles.row}>
        <FieldRow label="Tank mix record" value={record.tank_mix_record} />
        <FieldRow label="Equipment notes" value={record.equipment_notes} />
        <FieldRow label="Truck ID" value={record.truck_id} />
      </View>
      <View style={styles.row}>
        <FieldRow label="Nozzle type" value={record.nozzle_type} />
        <FieldRow label="REI" value={record.rei} />
        <FieldRow label="Safe re-entry date" value={record.safe_reentry_date} />
      </View>
      <View style={styles.fullWidthBlock}>
        <Text style={styles.label}>Additional notes</Text>
        <Text style={[styles.value, styles.notesValue]}>{valueOrDash(record.additional_notes)}</Text>
      </View>
      <View style={styles.row}>
        <FieldRow label="Attested" value={record.cert_attested ? "Yes" : "No"} />
        <FieldRow label="Applicator signature" value={record.applicator_sig} />
        <FieldRow label="License / cert #" value={record.license_cert_no} />
      </View>
      <View style={styles.row}>
        <FieldRow
          label="Submitted"
          value={`${formatTimestamp(record.submitted_at)} by ${valueOrDash(record.submitted_by_name)}`}
        />
        <FieldRow label="Last modified" value={formatTimestamp(record.last_modified_at)} />
        <FieldRow label="Modified by" value={record.last_modified_by_name} />
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footerRow} fixed>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      <Text style={styles.footerText}>{BRAND.name} — Application Record</Text>
    </View>
  );
}

export function AppRecordPdf({ data }: { data: AppRecordPdfData }) {
  const meta = brandedDocumentMeta({
    documentType: "Application Record",
    reference: data.record.job_date,
  });
  return (
    <Document
      title={meta.title}
      author={meta.author}
      subject={meta.subject}
      keywords={meta.keywords}
      creator={meta.creator}
      producer={meta.producer}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.runningHeader} fixed>
          {BRAND.name} — Application Record
        </Text>
        <HeaderSection data={data} />
        <JobSection data={data} />
        <GpsWeatherSection data={data} />
        <ApplicationSection data={data} />
        <MixRecordsSection linkedMixRecords={data.linkedMixRecords} />
        <PesticidesSection pesticides={data.pesticides} />
        <TotalsSection data={data} />
        <Footer />
      </Page>
    </Document>
  );
}
