import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { BRAND } from "@/lib/brand";

import { BrandPdfHeader, brandPdfMetaStyles } from "./BrandPdfHeader";
import { brandedDocumentMeta } from "./documentMeta";
import type { QuotePdfData } from "./getQuoteForPdf";
import { PDF_THEME } from "./theme";

const EM_DASH = "-";
const DOC_LABEL = "QUOTE";

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
    marginBottom: 2,
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
  value: {
    fontSize: PDF_THEME.typography.bodyPt,
    color: PDF_THEME.colors.foreground,
  },
  mutedValue: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
  },
  monoRow: {
    marginBottom: 2,
  },
  billToBlock: {
    paddingRight: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: PDF_THEME.colors.divider,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: PDF_THEME.colors.divider,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PDF_THEME.colors.divider,
  },
  tableCellDescription: {
    flex: 1.9,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tableCellQty: {
    flex: 0.8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "right",
  },
  tableCellUnit: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "right",
  },
  tableCellAmount: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "right",
  },
  tableHeadText: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.foreground,
  },
  totalsWrap: {
    marginTop: 10,
    alignSelf: "flex-end",
    width: "52%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: PDF_THEME.typography.bodyPt,
    color: PDF_THEME.colors.muted,
  },
  totalValue: {
    fontSize: PDF_THEME.typography.bodyPt,
    color: PDF_THEME.colors.foreground,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: PDF_THEME.colors.divider,
    paddingTop: 5,
    marginTop: 3,
  },
  grandTotalLabel: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.bodyPt,
    color: PDF_THEME.colors.foreground,
  },
  grandTotalValue: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.titlePt,
    color: PDF_THEME.colors.foreground,
  },
  notesValue: {
    whiteSpace: "pre-wrap",
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
  if (value === null || value === undefined || value === "") return EM_DASH;
  return String(value);
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return EM_DASH;
  const date = new Date(timestamp);
  if (Number.isNaN(date.valueOf())) return timestamp;
  return date.toISOString().slice(0, 10);
}

function money(n: number): string {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

function compactAddress(customer: QuotePdfData["customer"]): string | null {
  if (!customer) return null;
  const line = [customer.address].filter(Boolean).join("");
  const cityStateZip = [customer.city, customer.state, customer.zip].filter(Boolean).join(" ");
  if (line && cityStateZip) return `${line}, ${cityStateZip}`;
  return line || cityStateZip || null;
}

function formatQty(quantity: number, basis: string): string {
  const display = Number(quantity) || 0;
  if (basis === "per_acre") return `${display} ac`;
  return String(display);
}

function HeaderSection({ data }: { data: QuotePdfData }) {
  const quoteNumber = data.quote.quote_number || data.quote.id.slice(0, 8);

  return (
    <View style={styles.section} wrap={false}>
      <BrandPdfHeader documentTitle={DOC_LABEL}>
        <Text style={brandPdfMetaStyles.docMeta}>
          Quote #: <Text style={brandPdfMetaStyles.docMetaValue}>{quoteNumber}</Text>
        </Text>
        <Text style={brandPdfMetaStyles.docMeta}>
          Date: <Text style={brandPdfMetaStyles.docMetaValue}>{formatTimestamp(data.quote.quote_date)}</Text>
        </Text>
        {data.quote.valid_until ? (
          <Text style={brandPdfMetaStyles.docMeta}>
            Valid until:{" "}
            <Text style={brandPdfMetaStyles.docMetaValue}>{formatTimestamp(data.quote.valid_until)}</Text>
          </Text>
        ) : null}
      </BrandPdfHeader>
    </View>
  );
}

function BillToSection({ data }: { data: QuotePdfData }) {
  const customer = data.customer;
  const customerName = customer?.name || data.quote.customer_name || null;
  const addressLine = compactAddress(customer);

  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.row}>
        <View style={[styles.column, styles.billToBlock]}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text style={[styles.value, styles.monoRow]}>{valueOrDash(customerName)}</Text>
          <Text style={[styles.value, styles.monoRow]}>{valueOrDash(customer?.contact_name)}</Text>
          <Text style={[styles.value, styles.monoRow]}>{valueOrDash(customer?.email)}</Text>
          <Text style={[styles.value, styles.monoRow]}>{valueOrDash(customer?.phone)}</Text>
          <Text style={[styles.value, styles.monoRow]}>{valueOrDash(addressLine)}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>JOB DETAILS</Text>
          {data.quote.service_for ? (
            <View style={styles.monoRow}>
              <Text style={[styles.mutedValue]}>Service: </Text>
              <Text style={styles.value}>{data.quote.service_for}</Text>
            </View>
          ) : null}
          {data.quote.acres ? (
            <View style={styles.monoRow}>
              <Text style={[styles.mutedValue]}>Acres: </Text>
              <Text style={styles.value}>{data.quote.acres}</Text>
            </View>
          ) : null}
          {data.quote.adjuvant_surfactant ? (
            <View style={styles.monoRow}>
              <Text style={[styles.mutedValue]}>Adjuvant/Surfactant: </Text>
              <Text style={styles.value}>{data.quote.adjuvant_surfactant}</Text>
            </View>
          ) : null}
          {data.quote.price_per_acre ? (
            <View style={styles.monoRow}>
              <Text style={[styles.mutedValue]}>Price per acre: </Text>
              <Text style={styles.value}>{money(data.quote.price_per_acre)}/acre</Text>
            </View>
          ) : null}
          {data.quote.mileage ? (
            <View style={styles.monoRow}>
              <Text style={[styles.mutedValue]}>Mileage: </Text>
              <Text style={styles.value}>{data.quote.mileage} miles</Text>
            </View>
          ) : null}
          {!data.quote.service_for &&
            !data.quote.acres &&
            !data.quote.adjuvant_surfactant &&
            !data.quote.price_per_acre &&
            !data.quote.mileage ? (
            <Text style={styles.value}>{EM_DASH}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function LineItemsSection({ data }: { data: QuotePdfData }) {
  const subtotal = Number(data.quote.subtotal || 0);
  const taxRate = Number(data.quote.tax_rate || 0);
  const tax = Math.round((subtotal * (taxRate / 100) + Number.EPSILON) * 100) / 100;
  const otherAmount = Number(data.quote.other_amount || 0);

  return (
    <View style={styles.section}>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellDescription, styles.tableHeadText]}>Description</Text>
          <Text style={[styles.tableCellQty, styles.tableHeadText]}>Qty</Text>
          <Text style={[styles.tableCellUnit, styles.tableHeadText]}>Unit Price</Text>
          <Text style={[styles.tableCellAmount, styles.tableHeadText]}>Amount</Text>
        </View>
        {(data.lineItems.length ? data.lineItems : [{ description: EM_DASH, basis: "flat", quantity: 0, unit_price: 0, amount: 0, kind: "custom" }]).map(
          (line, index) => (
            <View key={`${line.description}-${index}`} style={styles.tableRow}>
              <Text style={styles.tableCellDescription}>{valueOrDash(line.description)}</Text>
              <Text style={styles.tableCellQty}>{formatQty(line.quantity, line.basis)}</Text>
              <Text style={styles.tableCellUnit}>{money(line.unit_price)}</Text>
              <Text style={styles.tableCellAmount}>{money(line.amount)}</Text>
            </View>
          ),
        )}
      </View>

      <View style={styles.totalsWrap}>
        <View style={styles.totalsRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{money(subtotal)}</Text>
        </View>
        {taxRate > 0 ? (
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
            <Text style={styles.totalValue}>{money(tax)}</Text>
          </View>
        ) : null}
        {otherAmount !== 0 ? (
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>{data.quote.other_label || "Other"}</Text>
            <Text style={styles.totalValue}>{money(otherAmount)}</Text>
          </View>
        ) : null}
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>TOTAL</Text>
          <Text style={styles.grandTotalValue}>{money(data.quote.total)}</Text>
        </View>
      </View>
    </View>
  );
}

function NotesTermsSection({ data }: { data: QuotePdfData }) {
  return (
    <View style={styles.section}>
      {data.quote.notes ? (
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>NOTES</Text>
          <View style={styles.divider} />
          <Text style={[styles.value, styles.notesValue]}>{data.quote.notes}</Text>
        </View>
      ) : null}

      {data.quote.terms ? (
        <View>
          <Text style={styles.sectionTitle}>TERMS</Text>
          <View style={styles.divider} />
          <Text style={[styles.value, styles.notesValue]}>{data.quote.terms}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ClosingSection() {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.mutedValue}>Thank you - please reach out with any questions.</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footerRow} fixed>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      <Text style={styles.footerText}>{BRAND.name} — Quote</Text>
    </View>
  );
}

export function QuotePdf({ data }: { data: QuotePdfData }) {
  const meta = brandedDocumentMeta({
    documentType: "Quote",
    reference: data.quote.quote_number || data.quote.id.slice(0, 8),
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
          {BRAND.name} — {DOC_LABEL}
        </Text>
        <HeaderSection data={data} />
        <BillToSection data={data} />
        <LineItemsSection data={data} />
        <NotesTermsSection data={data} />
        <ClosingSection />
        <Footer />
      </Page>
    </Document>
  );
}
