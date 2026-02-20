import { useCallback } from "react";

import { log, LOG_CATEGORIES } from "logger";
import type { SyntheticEvent } from "react";

import { dateNow } from "packages/utils/core/date";

import {
  injectPdfErrorUI,
  inspectIframeContentAfterLoad,
} from "./pdfIframeHelpers";

export function usePdfIframeHandlers(
  reportId: string | null | undefined,
  currentReportAddress: string | null,
  currentPdf: string | null,
) {
  const onLoad = useCallback(
    (e: SyntheticEvent<HTMLIFrameElement>) => {
      const iframe = e.currentTarget;
      log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] iframe onLoad event fired", {
        src: iframe.src,
        reportId,
        currentReportAddress,
        timestamp: dateNow().toISOString(),
      });
      inspectIframeContentAfterLoad(iframe, reportId, currentReportAddress);
    },
    [reportId, currentReportAddress],
  );

  const onError = useCallback(
    (e: SyntheticEvent<HTMLIFrameElement>) => {
      const iframe = e.currentTarget;
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[PdfModal] iframe onError event fired",
        e,
      );
      log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] iframe onError context", {
        src: iframe.src,
        reportId,
        currentReportAddress,
        timestamp: dateNow().toISOString(),
      });
      injectPdfErrorUI(iframe, currentPdf);
    },
    [reportId, currentReportAddress, currentPdf],
  );

  return { onLoad, onError };
}
