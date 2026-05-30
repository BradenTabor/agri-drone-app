export const PDF_THEME = {
  colors: {
    foreground: "#1A1F1B", // near-black with green undertone
    muted: "#5E6360", // muted gray for field labels
    accent: "#2F5D3F", // deep field green for accents (page header rule)
    divider: "#D6D6D2", // section dividers
    background: "#FFFFFF", // white page
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
