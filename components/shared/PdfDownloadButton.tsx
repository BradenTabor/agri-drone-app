"use client";

import { PdfExportPanel, type PdfExportPanelProps } from "@/components/shared/PdfExportPanel";

export type { PdfExportPanelProps };

/** Back-compat alias — prefer PdfExportPanel. */
export function PdfDownloadButton(props: PdfExportPanelProps) {
  return <PdfExportPanel {...props} />;
}
