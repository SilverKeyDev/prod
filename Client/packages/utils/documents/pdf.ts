/**
 * PDF Viewer Utilities
 * Optimizations and helpers for PDF viewing functionality
 */

/**
 * Generate optimized PDF viewer URL with performance parameters
 * @param pdfUrl - The base PDF URL
 * @param options - Optional configuration for the PDF viewer
 * @param reportId - Optional report ID to use proxy endpoint for iframe-friendly viewing
 * @returns Optimized PDF viewer URL
 */
export const generateOptimizedPdfUrl = (
  pdfUrl: string,
  options: {
    disableToolbar?: boolean;
    disableNavPanes?: boolean;
    disableScrollbars?: boolean;
    viewMode?: "FitH" | "FitV" | "Fit" | "FitB";
    enableFullscreen?: boolean;
  } = {},
  reportId?: string,
): string => {
  // If we have a reportId, use the proxy endpoint for iframe-friendly viewing
  if (reportId && typeof window !== "undefined") {
    const baseUrl = window.location.origin;
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

  // Add performance optimizations
  params.append("disableWorker", "false"); // Keep worker enabled for better performance
  params.append("textLayer", "true"); // Enable text layer for better accessibility

  const baseUrl = pdfUrl.split("#")[0]; // Remove existing fragments
  return `${baseUrl}#${params.toString()}`;
};

/**
 * Get iframe sandbox attributes for PDF viewing
 * Balances security with functionality needed for PDF viewing
 * For same-origin PDFs served through our API, we use undefined (no sandbox)
 * to avoid Chrome blocking the content
 */
export const getPdfIframeSandbox = (
  isSameOrigin: boolean = true,
): string | undefined => {
  // For same-origin PDFs, don't use sandbox to avoid Chrome blocking
  // The server-side security headers (X-Frame-Options: SAMEORIGIN, CSP) provide protection
  if (isSameOrigin) {
    return undefined;
  }

  // For cross-origin PDFs (e.g., S3 presigned URLs), use restrictive sandbox
  return "allow-same-origin allow-scripts allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation";
};

/**
 * Get iframe allow attributes for PDF viewing
 * Specifies what features the iframe can use
 */
export const getPdfIframeAllow = (): string => {
  return "fullscreen; clipboard-read; clipboard-write";
};

/**
 * CSS styles to optimize PDF viewer performance
 * Helps mitigate passive event listener warnings
 */
export const getPdfViewerStyles = (): React.CSSProperties => ({
  touchAction: "pan-x pan-y pinch-zoom",
  overscrollBehavior: "contain",
  scrollBehavior: "smooth",
});

/**
 * Check if the current environment supports PDF.js optimizations
 * @returns true if optimizations should be applied
 */
export const shouldApplyPdfOptimizations = (): boolean => {
  // Check if we're in a modern browser that supports the optimizations
  return (
    typeof window !== "undefined" &&
    "IntersectionObserver" in window &&
    "ResizeObserver" in window
  );
};

/**
 * Debounce function for PDF viewer events
 * Helps reduce the frequency of expensive operations
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
