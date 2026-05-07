import { color } from "packages/design-tokens";
import { log, LOG_CATEGORIES } from "packages/logger";
import { DOCUMENT_ACTION_LABELS } from "packages/utils/domain/actionLabels";
import { getDocument, getWindow } from "packages/utils/platform";

export function inspectIframeContentAfterLoad(
  iframe: HTMLIFrameElement,
  _reportId: string | null | undefined,
  _currentReportAddress: string | null
) {
  setTimeout(() => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const bodyText = doc.body?.innerText || "";
        const bodyHTMLLength = doc.body?.innerHTML.length || 0;
        const hasError =
          bodyText.includes("blocked") ||
          bodyText.includes("error") ||
          bodyText.includes("ERR_") ||
          bodyText.toLowerCase().includes("this document cannot be displayed");

        log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] iframe content accessible", {
          bodyHTMLLength,
          hasError,
        });

        if (hasError) {
          log.error(
            LOG_CATEGORIES.ERRORS,
            "[PdfModal] Browser blocked or failed to load PDF content"
          );
          log.warn(LOG_CATEGORIES.HTTP, "[PdfModal] User can use Open in New Tab to view PDF");
        } else if (bodyHTMLLength === 0 && bodyText.length === 0) {
          log.warn(
            LOG_CATEGORIES.HTTP,
            "[PdfModal] iframe content is empty; PDF may still be loading or failed silently"
          );
          log.debug(
            LOG_CATEGORIES.HTTP,
            "[PdfModal] If PDF is blank, check backend PDF generation/retrieval"
          );
        } else {
          log.debug(
            LOG_CATEGORIES.HTTP,
            "[PdfModal] iframe content detected; PDF viewer should be active"
          );
        }
      } else {
        log.debug(
          LOG_CATEGORIES.HTTP,
          "[PdfModal] iframe is cross-origin or PDF plugin is handling rendering"
        );
      }
    } catch {
      log.debug(
        LOG_CATEGORIES.HTTP,
        "[PdfModal] Cannot access iframe content (PDF plugin rendering)"
      );
      log.debug(
        LOG_CATEGORIES.HTTP,
        "[PdfModal] If PDF is blank, verify backend + headers + non-empty PDF"
      );
    }
  }, 500);
}

export function injectPdfErrorUI(iframe: HTMLIFrameElement, currentPdf: string | null) {
  let canAccessContent = false;
  try {
    canAccessContent = iframe?.contentDocument?.body != null;
  } catch {
    log.debug(
      LOG_CATEGORIES.HTTP,
      "[PdfModal] Cannot access iframe content (cross-origin); skipping error UI injection"
    );
  }

  if (!canAccessContent || !iframe?.contentDocument?.body || !currentPdf) {
    return;
  }

  const doc = getDocument();
  if (!doc) return;

  const errorDiv = doc.createElement("div");
  errorDiv.style.cssText =
    "padding: 40px; text-align: center; font-family: system-ui, -apple-system, sans-serif; background: #faf9f7;";

  const contentDiv = doc.createElement("div");
  contentDiv.style.cssText =
    "max-width: 400px; margin: 0 auto; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(164, 117, 81, 0.1); border: 1px solid #D4AF7F;";

  const iconDiv = doc.createElement("div");
  iconDiv.style.cssText =
    "width: 60px; height: 60px; background: #A47551; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;";

  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("fill", "white");
  svg.setAttribute("viewBox", "0 0 24 24");

  const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
  );

  svg.appendChild(path);
  iconDiv.appendChild(svg);

  const title = doc.createElement("h3");
  title.style.cssText = "color: #A47551; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;";
  title.textContent = "Unable to load PDF preview";

  contentDiv.appendChild(iconDiv);
  contentDiv.appendChild(title);
  errorDiv.appendChild(contentDiv);

  const description = doc.createElement("p");
  description.style.cssText = "color: #666; margin: 0 0 20px 0; line-height: 1.5;";
  description.textContent =
    "The PDF couldn't be displayed in the browser. You can download it directly instead.";

  const buttonContainer = doc.createElement("div");
  buttonContainer.style.cssText =
    "display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;";

  const downloadLink = doc.createElement("a");
  downloadLink.href = currentPdf;
  downloadLink.download = "";
  const downloadBg = color("foreground");
  const downloadBgHover = color("foreground-muted");
  downloadLink.style.cssText = `display: inline-flex; flex-direction: row; align-items: center; background: ${downloadBg}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;`;
  downloadLink.textContent = DOCUMENT_ACTION_LABELS.DOWNLOAD_PDF;
  downloadLink.onmouseover = () => (downloadLink.style.background = downloadBgHover);
  downloadLink.onmouseout = () => (downloadLink.style.background = downloadBg);

  const openTabBg = color("neutral.500");
  const openTabBgHover = color("neutral.600");
  const openTabButton = doc.createElement("button");
  openTabButton.style.cssText = `background: ${openTabBg}; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background 0.2s;`;
  openTabButton.textContent = DOCUMENT_ACTION_LABELS.OPEN_PDF_NEW_TAB;
  const win = getWindow();
  openTabButton.onclick = () => {
    if (win) win.open(currentPdf, "_blank", "noopener,noreferrer");
  };
  openTabButton.onmouseover = () => (openTabButton.style.background = openTabBgHover);
  openTabButton.onmouseout = () => (openTabButton.style.background = openTabBg);

  buttonContainer.appendChild(downloadLink);
  buttonContainer.appendChild(openTabButton);

  contentDiv.appendChild(description);
  contentDiv.appendChild(buttonContainer);

  iframe.contentDocument.body.textContent = "";
  iframe.contentDocument.body.appendChild(errorDiv);
}
