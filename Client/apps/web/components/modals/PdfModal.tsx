import { Download, Share, X } from "lucide-react";
import React, { useRef, useEffect } from "react";

import { formatFilenameToAddress } from "../../../../packages/utils/address";
import {
  generateOptimizedPdfUrl,
  getPdfIframeSandbox,
  getPdfIframeAllow,
  getPdfViewerStyles,
} from "../../../../packages/utils/pdf";
import MiniLogo from "../ui/asset/MiniLogo";

export type PdfModalProps = {
  currentPdf: string | null;
  currentReportAddress: string | null;
  reportId?: string | null;
  onClose: () => void;
  onShare?: () => void;
  // reports?: unknown[]; // Optional, not used in modal rendering
};

const PdfModal: React.FC<PdfModalProps> = ({
  currentPdf,
  currentReportAddress,
  reportId,
  onClose,
  onShare,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Monitor network requests to diagnose PDF loading issues
  useEffect(() => {
    if (!currentPdf || !reportId) return;

    console.log("[PdfModal] Testing server endpoint accessibility", {
      currentPdf,
      reportId,
      timestamp: new Date().toISOString(),
    });

    // Test if the URL is accessible by making a fetch request
    const testUrl = async () => {
      try {
        const url = `${window.location.origin}/api/v1/report/${reportId}/view`;
        console.log("[PdfModal] Fetching URL to test accessibility:", url);

        const response = await fetch(url, {
          method: "HEAD", // Use HEAD to avoid downloading the full PDF
          credentials: "include",
        });

        console.log("[PdfModal] Server response", {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: {
            contentType: response.headers.get("content-type"),
            contentLength: response.headers.get("content-length"),
            contentDisposition: response.headers.get("content-disposition"),
            xFrameOptions: response.headers.get("x-frame-options"),
            contentSecurityPolicy: response.headers.get(
              "content-security-policy"
            ),
            accessControlAllowOrigin: response.headers.get(
              "access-control-allow-origin"
            ),
          },
          timestamp: new Date().toISOString(),
        });

        // Enhanced header validation with graceful fallback
        const xfo = (
          response.headers.get("x-frame-options") || ""
        ).toUpperCase();
        const csp = response.headers.get("content-security-policy") || "";
        const contentType = response.headers.get("content-type") || "";
        const contentDisposition =
          response.headers.get("content-disposition") || "";

        // Check if CSP blocks framing
        const cspBlocks =
          /\bframe-ancestors\s+['"]?none['"]?/i.test(csp) ||
          (/\bframe-ancestors\b/i.test(csp) &&
            !/frame-ancestors[^;]*'self'/i.test(csp));

        // Determine if iframe embedding will work
        if (xfo === "DENY") {
          console.error(
            "[PdfModal] ❌ X-Frame-Options is DENY - PDF will be blocked in iframe!"
          );
          console.warn(
            "[PdfModal] 🔄 Note: iframe will likely fail, but keeping modal open. User can use 'Open in New Tab' button."
          );
          // Don't auto-close - let the user control it
        } else if (cspBlocks) {
          console.error(
            "[PdfModal] ❌ CSP frame-ancestors blocks iframe embedding!"
          );
          console.warn(
            "[PdfModal] 🔄 Note: iframe will likely fail, but keeping modal open. User can use 'Open in New Tab' button."
          );
          // Don't auto-close - let the user control it
        } else if (xfo) {
          console.log(`[PdfModal] ✅ X-Frame-Options is ${xfo} - should work`);
        } else {
          console.log(
            "[PdfModal] ✅ X-Frame-Options not set - relying on CSP (good)"
          );
        }

        // Verify Content-Type
        if (!contentType.includes("application/pdf")) {
          console.warn(
            `[PdfModal] ⚠️ Content-Type is ${contentType}, expected application/pdf`
          );
        }

        // Verify Content-Disposition is inline
        if (!contentDisposition.includes("inline")) {
          console.warn(
            `[PdfModal] ⚠️ Content-Disposition is ${contentDisposition}, should include "inline"`
          );
        }

        if (!response.ok) {
          console.error("[PdfModal] Server returned error status", {
            status: response.status,
            statusText: response.statusText,
            url,
          });
        }
      } catch (error) {
        console.error("[PdfModal] Failed to fetch URL", {
          error,
          currentPdf,
          reportId,
          timestamp: new Date().toISOString(),
        });
      }
    };

    void testUrl();
  }, [currentPdf, reportId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const getReportTitle = () => {
    if (currentReportAddress) {
      return formatFilenameToAddress(currentReportAddress);
    }
    if (!currentPdf) return "Property Report";
    return formatFilenameToAddress(currentPdf);
  };

  const handleDownload = () => {
    if (currentPdf) {
      const link = document.createElement("a");
      link.href = currentPdf;
      link.download = `${getReportTitle()}.pdf`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (currentPdf) {
      window.open(currentPdf, "_blank", "noopener,noreferrer");
    }
  };

  if (!currentPdf) return null;

  console.log("[PdfModal] Rendering modal", {
    currentPdf,
    currentReportAddress,
    reportId,
    pdfUrlLength: currentPdf.length,
    pdfUrlStart: currentPdf.substring(0, 100),
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="space-responsive-sm fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div
        ref={modalRef}
        className="viewer-container flex h-[95vh] w-full max-w-5xl flex-col sm:h-[90vh]"
        role="dialog"
        aria-modal="true"
        style={{
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(12px)",
          background: "rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Gold Header with Address and Actions */}
        <div
          className="flex items-center justify-between bg-gradient-to-r from-brown to-brown/90 px-4 py-3"
          style={{ borderRadius: "24px 24px 0 0" }}
        >
          {/* Logo and Address Title */}
          <div className="gap-responsive-sm flex items-center min-w-0 flex-1">
            <div
              className="text-white flex-shrink-0"
              style={{ filter: "brightness(0) invert(1)" }}
            >
              <MiniLogo className="mobile-icon-lg" />
            </div>
            <h2 className="text-responsive-lg truncate font-semibold text-white min-w-0">
              {getReportTitle()}
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="gap-responsive-sm flex items-center flex-shrink-0">
            {/* Download Button (Desktop only) */}
            <button
              onClick={handleDownload}
              className="group hidden rounded-lg p-2 transition-colors duration-200 hover:bg-white/10 sm:flex"
              title="Download PDF"
            >
              <Download className="h-6 w-6 text-white transition-transform duration-200 group-hover:scale-110" />
            </button>

            {/* Open in New Tab Button (Desktop only) */}
            <button
              onClick={handleOpenInNewTab}
              className="group hidden rounded-lg p-2 transition-colors duration-200 hover:bg-white/10 sm:flex"
              title="Open in New Tab"
            >
              <svg
                className="h-6 w-6 text-white transition-transform duration-200 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>

            {/* Share Button (Desktop only) */}
            {onShare && (
              <button
                onClick={onShare}
                className="group hidden rounded-lg p-2 transition-colors duration-200 hover:bg-white/10 sm:flex"
                title="Share Report"
              >
                <Share className="h-6 w-6 text-white transition-transform duration-200 group-hover:scale-110" />
              </button>
            )}

            {/* Close Button (Visible on all screens) */}
            <button
              onClick={onClose}
              className="group rounded-lg p-2 transition-colors duration-200 hover:bg-white/10"
              title="Close"
            >
              <X className="h-6 w-6 text-white transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden" style={getPdfViewerStyles()}>
          <iframe
            src={(() => {
              const optimizedUrl = generateOptimizedPdfUrl(
                currentPdf,
                {},
                reportId || undefined
              );
              console.log("[PdfModal] Generated optimized URL for iframe", {
                originalUrl: currentPdf,
                optimizedUrl,
                reportId,
                timestamp: new Date().toISOString(),
              });
              return optimizedUrl;
            })()}
            className="h-full w-full border-0"
            title="PDF Viewer"
            allow={getPdfIframeAllow()}
            {...(reportId
              ? {} // No sandbox for same-origin API PDFs
              : { sandbox: getPdfIframeSandbox(false) })} // Sandbox for external PDFs
            referrerPolicy="no-referrer"
            onLoad={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              console.log("[PdfModal] iframe onLoad event fired", {
                src: iframe.src,
                reportId,
                currentReportAddress,
                timestamp: new Date().toISOString(),
              });

              // Try to detect if Chrome blocked the PDF
              setTimeout(() => {
                try {
                  // If we can access contentDocument, check what's in it
                  const doc =
                    iframe.contentDocument || iframe.contentWindow?.document;
                  if (doc) {
                    const bodyText = doc.body?.innerText || "";
                    console.log("[PdfModal] iframe content accessible", {
                      bodyText: bodyText.substring(0, 200),
                      hasError:
                        bodyText.includes("blocked") ||
                        bodyText.includes("error"),
                    });

                    if (
                      bodyText.includes("blocked") ||
                      bodyText.includes("ERR_")
                    ) {
                      console.error(
                        "[PdfModal] ❌ Chrome blocked the iframe content!"
                      );
                      console.warn(
                        "[PdfModal] Note: User can use 'Open in New Tab' button to view PDF"
                      );
                      // Don't auto-close - let user control it
                    }
                  } else {
                    // Cross-origin, which is expected for PDFs from S3
                    console.log(
                      "[PdfModal] ✅ iframe is cross-origin (expected for PDF viewing)"
                    );
                  }
                } catch (err) {
                  // Cross-origin access blocked - this is actually good, means PDF is loading
                  console.log(
                    "[PdfModal] ✅ Cannot access iframe content (cross-origin) - PDF should be rendering"
                  );
                }
              }, 100);
            }}
            onError={(e) => {
              console.error("[PdfModal] iframe onError event fired", {
                src: (e.target as HTMLIFrameElement).src,
                reportId,
                currentReportAddress,
                error: e,
                timestamp: new Date().toISOString(),
              });
              const iframe = e.target as HTMLIFrameElement;

              // Only try to access contentDocument if it's same-origin
              // For cross-origin PDFs, the browser blocks this access
              let canAccessContent = false;
              try {
                canAccessContent = iframe?.contentDocument?.body != null;
              } catch {
                // Cross-origin access blocked - this is expected
                console.log(
                  "[PdfModal] Cannot access iframe content (cross-origin), skipping error UI injection"
                );
              }

              if (canAccessContent && iframe?.contentDocument?.body) {
                // Create error content safely using DOM methods
                const errorDiv = document.createElement("div");
                errorDiv.style.cssText =
                  "padding: 40px; text-align: center; font-family: system-ui, -apple-system, sans-serif; background: #faf9f7;";

                const contentDiv = document.createElement("div");
                contentDiv.style.cssText =
                  "max-width: 400px; margin: 0 auto; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(164, 117, 81, 0.1); border: 1px solid #D4AF7F;";

                const iconDiv = document.createElement("div");
                iconDiv.style.cssText =
                  "width: 60px; height: 60px; background: #A47551; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;";

                const svg = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "svg"
                );
                svg.setAttribute("width", "24");
                svg.setAttribute("height", "24");
                svg.setAttribute("fill", "white");
                svg.setAttribute("viewBox", "0 0 24 24");

                const path = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "path"
                );
                path.setAttribute(
                  "d",
                  "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                );

                svg.appendChild(path);
                iconDiv.appendChild(svg);

                const title = document.createElement("h3");
                title.style.cssText =
                  "color: #A47551; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;";
                title.textContent = "Unable to load PDF preview";

                contentDiv.appendChild(iconDiv);
                contentDiv.appendChild(title);
                errorDiv.appendChild(contentDiv);

                const description = document.createElement("p");
                description.style.cssText =
                  "color: #666; margin: 0 0 20px 0; line-height: 1.5;";
                description.textContent =
                  "The PDF couldn't be displayed in the browser. You can download it directly instead.";

                const buttonContainer = document.createElement("div");
                buttonContainer.style.cssText =
                  "display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;";

                const downloadLink = document.createElement("a");
                downloadLink.href = currentPdf;
                downloadLink.download = "";
                downloadLink.style.cssText =
                  "display: inline-block; background: #A47551; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;";
                downloadLink.textContent = "Download PDF";
                downloadLink.onmouseover = () =>
                  (downloadLink.style.background = "#8B5A3C");
                downloadLink.onmouseout = () =>
                  (downloadLink.style.background = "#A47551");

                const openTabButton = document.createElement("button");
                openTabButton.style.cssText =
                  "background: #6B7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background 0.2s;";
                openTabButton.textContent = "Open in New Tab";
                openTabButton.onclick = () => {
                  window.open(currentPdf, "_blank", "noopener,noreferrer");
                };
                openTabButton.onmouseover = () =>
                  (openTabButton.style.background = "#4B5563");
                openTabButton.onmouseout = () =>
                  (openTabButton.style.background = "#6B7280");

                buttonContainer.appendChild(downloadLink);
                buttonContainer.appendChild(openTabButton);

                contentDiv.appendChild(description);
                contentDiv.appendChild(buttonContainer);

                iframe.contentDocument.body.textContent = "";
                iframe.contentDocument.body.appendChild(errorDiv);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfModal;
