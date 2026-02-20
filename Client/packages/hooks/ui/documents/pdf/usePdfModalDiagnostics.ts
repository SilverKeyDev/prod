import { useEffect } from "react";

import { runPdfUrlDiagnostics } from "./pdfModalDiagnosticsHelpers";

/**
 * Runs HEAD request and header validation when currentPdf/reportId change.
 * Logs X-Frame-Options, CSP, Content-Type, Content-Disposition, Content-Length for debugging.
 */
export function usePdfModalDiagnostics(
  currentPdf: string | null,
  reportId?: string | null,
): void {
  useEffect(() => {
    void runPdfUrlDiagnostics(currentPdf, reportId);
  }, [currentPdf, reportId]);
}
