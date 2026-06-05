/**
 * PDF viewer helpers for iframe embedding and performance tuning.
 */

import { getWindow } from "packages/utils/core/platform";

/** Inline styles for PDF iframe viewers (React.CSSProperties-compatible shape). */
export type PdfViewerInlineStyles = Record<string, string | number | undefined>;

export const generateOptimizedPdfUrl = (
  pdfUrl: string,
  options: {
    disableToolbar?: boolean;
    disableNavPanes?: boolean;
    disableScrollbars?: boolean;
    viewMode?: "FitH" | "FitV" | "Fit" | "FitB";
    enableFullscreen?: boolean;
  } = {},
  reportId?: string
): string => {
  const win = getWindow();
  if (reportId && win) {
    const baseUrl = win.location.origin;
    return `${baseUrl}/api/v1/report/${reportId}/view`;
  }

  const {
    disableToolbar = true,
    disableNavPanes = true,
    disableScrollbars = true,
    viewMode = "FitH",
  } = options;

  const params = new URLSearchParams();

  if (disableToolbar) params.append("toolbar", "0");
  if (disableNavPanes) params.append("navpanes", "0");
  if (disableScrollbars) params.append("scrollbar", "0");
  if (viewMode) params.append("view", viewMode);

  params.append("disableWorker", "false");
  params.append("textLayer", "true");

  const baseUrl = pdfUrl.split("#")[0];
  return `${baseUrl}#${params.toString()}`;
};

export const getPdfIframeSandbox = (isSameOrigin: boolean = true): string | undefined => {
  if (isSameOrigin) {
    return undefined;
  }

  return "allow-same-origin allow-scripts allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation";
};

export const getPdfIframeAllow = (): string => {
  return "fullscreen; clipboard-read; clipboard-write";
};

export const getPdfViewerStyles = (): PdfViewerInlineStyles => ({
  touchAction: "pan-x pan-y pinch-zoom",
  overscrollBehavior: "contain",
  scrollBehavior: "smooth",
});

export const shouldApplyPdfOptimizations = (): boolean => {
  const win = getWindow();
  if (!win) return false;
  return "IntersectionObserver" in win && "ResizeObserver" in win;
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
