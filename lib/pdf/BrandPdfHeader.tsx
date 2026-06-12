import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { BRAND } from "@/lib/brand";

import { getBrandLogoPath } from "./logoPath";
import { PDF_THEME } from "./theme";

const styles = StyleSheet.create({
  brandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: PDF_THEME.colors.accent,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "62%",
  },
  logo: {
    width: 34,
    height: 51,
    marginRight: 10,
  },
  brandText: {
    flexShrink: 1,
  },
  brandName: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: 12,
    color: PDF_THEME.colors.foreground,
    marginBottom: 2,
  },
  brandMeta: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
    marginBottom: 1,
  },
  docRight: {
    alignItems: "flex-end",
    maxWidth: "36%",
  },
  docTitle: {
    fontFamily: PDF_THEME.fonts.bold,
    fontSize: PDF_THEME.typography.titlePt,
    color: PDF_THEME.colors.accent,
    marginBottom: 4,
    textAlign: "right",
  },
  docMeta: {
    fontSize: PDF_THEME.typography.smallPt,
    color: PDF_THEME.colors.muted,
    marginBottom: 1,
    textAlign: "right",
  },
  docMetaValue: {
    fontFamily: PDF_THEME.fonts.bold,
    color: PDF_THEME.colors.foreground,
  },
});

type BrandPdfHeaderProps = {
  documentTitle: string;
  children?: ReactNode;
};

export function BrandPdfHeader({ documentTitle, children }: BrandPdfHeaderProps) {
  return (
    <View style={styles.brandHeader} wrap={false}>
      <View style={styles.brandLeft}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image does not support alt */}
        <Image src={getBrandLogoPath()} style={styles.logo} />
        <View style={styles.brandText}>
          <Text style={styles.brandName}>{BRAND.name}</Text>
          <Text style={styles.brandMeta}>{BRAND.address}</Text>
          <Text style={styles.brandMeta}>
            {BRAND.phone} | {BRAND.email}
          </Text>
          <Text style={styles.brandMeta}>Contact: {BRAND.contact}</Text>
        </View>
      </View>

      <View style={styles.docRight}>
        <Text style={styles.docTitle}>{documentTitle}</Text>
        {children}
      </View>
    </View>
  );
}

export const brandPdfMetaStyles = styles;
