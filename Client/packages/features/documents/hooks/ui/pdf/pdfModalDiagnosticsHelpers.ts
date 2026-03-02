import { log, LOG_CATEGORIES } from "packages/logger";
import { dateNow } from "packages/utils/date";

import { reportApi } from "@/features/documents/api/report";

/**
 * Runs HEAD request and header validation for PDF view URL.
 * Extracted to satisfy max-lines-per-function in usePdfModalDiagnostics.
 */
export async function runPdfUrlDiagnostics(
  currentPdf: string | null,
  reportId: string | null | undefined
): Promise<void> {
  if (!currentPdf || !reportId) return;

  log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] Testing server endpoint accessibility", {
    currentPdf,
    reportId,
    timestamp: dateNow().toISOString(),
  });

  try {
    const url = `/api/v1/report/${reportId}/view`;
    log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] Fetching URL to test accessibility", { url });

    const response = await reportApi.checkViewUrl(reportId);

    log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] Server response", {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.status >= 200 && response.status < 300,
      headers: {
        contentType: response.headers["content-type"],
        contentLength: response.headers["content-length"],
        contentDisposition: response.headers["content-disposition"],
        xFrameOptions: response.headers["x-frame-options"],
        contentSecurityPolicy: response.headers["content-security-policy"],
        accessControlAllowOrigin: response.headers["access-control-allow-origin"],
      },
      timestamp: dateNow().toISOString(),
    });

    const xfo = (response.headers["x-frame-options"] || "").toUpperCase();
    const csp = response.headers["content-security-policy"] || "";
    const contentType = response.headers["content-type"] || "";
    const contentDisposition = response.headers["content-disposition"] || "";

    const cspBlocks =
      /\bframe-ancestors\s+['"]?none['"]?/i.test(csp) ||
      (/\bframe-ancestors\b/i.test(csp) && !/frame-ancestors[^;]*'self'/i.test(csp));

    if (xfo === "DENY") {
      log.error(
        LOG_CATEGORIES.ERRORS,
        "[PdfModal] X-Frame-Options is DENY - iframe will be blocked"
      );
      log.warn(
        LOG_CATEGORIES.HTTP,
        "[PdfModal] iframe likely blocked; user can use Open in New Tab"
      );
    } else if (cspBlocks) {
      log.error(LOG_CATEGORIES.ERRORS, "[PdfModal] CSP frame-ancestors blocks iframe embedding");
      log.warn(
        LOG_CATEGORIES.HTTP,
        "[PdfModal] iframe likely blocked; user can use Open in New Tab"
      );
    } else if (xfo) {
      log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] X-Frame-Options present", {
        xfo,
      });
    } else {
      log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] X-Frame-Options not set; relying on CSP");
    }

    if (!contentType.includes("application/pdf")) {
      log.warn(LOG_CATEGORIES.HTTP, "[PdfModal] Unexpected Content-Type", {
        contentType,
      });
    } else {
      log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] Content-Type ok", {
        contentType,
      });
    }

    if (!contentDisposition.includes("inline")) {
      log.warn(LOG_CATEGORIES.HTTP, "[PdfModal] Unexpected Content-Disposition", {
        contentDisposition,
      });
    } else {
      log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] Content-Disposition ok", {
        contentDisposition,
      });
    }

    const contentLength = response.headers["content-length"];
    if (contentLength) {
      const sizeBytes = parseInt(contentLength, 10);
      if (sizeBytes === 0) {
        log.error(LOG_CATEGORIES.ERRORS, "[PdfModal] PDF Content-Length is 0");
      } else if (sizeBytes < 100) {
        log.warn(LOG_CATEGORIES.HTTP, "[PdfModal] PDF Content-Length is very small", { sizeBytes });
      } else {
        log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] PDF Content-Length", {
          sizeBytes,
          sizeKB: Number((sizeBytes / 1024).toFixed(2)),
        });
      }
    } else {
      log.warn(LOG_CATEGORIES.HTTP, "[PdfModal] Content-Length header not present");
    }

    if (response.status < 200 || response.status >= 300) {
      log.error(LOG_CATEGORIES.ERRORS, "[PdfModal] Server returned error status", {
        status: response.status,
        statusText: response.statusText,
        url,
      });
    }
  } catch (error) {
    log.error(LOG_CATEGORIES.ERRORS, "[PdfModal] Failed to fetch URL", error);
    log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] Fetch URL context", {
      currentPdf,
      reportId,
      timestamp: dateNow().toISOString(),
    });
  }
}
