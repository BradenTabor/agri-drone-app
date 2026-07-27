import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/** @deprecated Prefer renderToBuffer from @react-pdf/renderer directly. */
export async function renderPdfToBuffer(
  document: ReactElement<DocumentProps>,
): Promise<Buffer> {
  return renderToBuffer(document);
}
