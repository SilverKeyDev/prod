import React, { useEffect, useMemo, useRef } from "react";

import { usePdfIframeHandlers } from "packages/features/documents/hooks/ui/pdf/usePdfIframeHandlers";
import { usePdfModalDiagnostics } from "packages/features/documents/hooks/ui/pdf/usePdfModalDiagnostics";
import { generateOptimizedPdfUrl } from "packages/features/documents/utils/pdf";
import { formatFilenameToAddress } from "packages/features/search/types/search/formatters/address";
import { useResponsive } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import ModalPortal from "packages/ui/components/modals/ModalPortal";
import type { PdfModalProps } from "packages/ui/components/modals/PdfModal/PdfModal.types";
import { PdfModalContent } from "packages/ui/components/modals/PdfModal/PdfModalContent";
import { PdfModalHeader } from "packages/ui/components/modals/PdfModal/PdfModalHeader";
import { Box } from "packages/ui/components/primitives";
import { dateNow } from "packages/utils/date";
import { getDocument, getWindow } from "packages/utils/platform";

/**
 * Web PDF modal: document hooks and URL optimization live here so `packages/ui`
 * stays free of `packages/features` imports.
 */
const DocumentPdfModal: React.FC<PdfModalProps> = ({
  currentPdf,
  currentReportAddress,
  reportId,
  onClose,
  onShare,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { isSmDown } = useResponsive();
  const isMobile = isSmDown;

  usePdfModalDiagnostics(currentPdf, reportId);

  useEffect(() => {
    if (currentPdf || currentReportAddress || reportId) {
      log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] Props updated", {
        currentPdf: currentPdf ? `${currentPdf.substring(0, 50)}...` : null,
        currentReportAddress,
        reportId,
        willRender: !!currentPdf,
        timestamp: dateNow().toISOString(),
      });
    }
  }, [currentPdf, currentReportAddress, reportId]);

  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    doc.addEventListener("mousedown", handleClickOutside);
    return () => doc.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (!currentPdf) return;
    const doc = getDocument();
    if (!doc?.body) return;
    const prev = doc.body.style.overflow;
    doc.body.style.overflow = "hidden";
    return () => {
      doc.body.style.overflow = prev;
    };
  }, [currentPdf]);

  useEffect(() => {
    if (!currentPdf) return;
    const doc = getDocument();
    if (!doc) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    doc.addEventListener("keydown", handleEscape);
    return () => doc.removeEventListener("keydown", handleEscape);
  }, [currentPdf, onClose]);

  const getReportTitle = () => {
    if (currentReportAddress) return formatFilenameToAddress(currentReportAddress);
    if (!currentPdf) return "Property Report";
    return formatFilenameToAddress(currentPdf);
  };

  const handleDownload = () => {
    const doc = getDocument();
    if (!currentPdf || !doc?.body) return;
    const link = doc.createElement("a");
    link.href = currentPdf;
    link.download = `${getReportTitle()}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    doc.body.appendChild(link);
    link.click();
    doc.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    const win = getWindow();
    if (currentPdf && win) {
      win.open(currentPdf, "_blank", "noopener,noreferrer");
    }
  };

  const optimizedPdfUrl = useMemo(() => {
    if (!currentPdf) return null;
    return generateOptimizedPdfUrl(currentPdf, {}, reportId || undefined);
  }, [currentPdf, reportId]);

  const { onLoad, onError } = usePdfIframeHandlers(reportId, currentReportAddress, currentPdf);

  useEffect(() => {
    if (optimizedPdfUrl) {
      log.debug(LOG_CATEGORIES.HTTP, "[PdfModal] Generated optimized URL for iframe", {
        originalUrl: currentPdf,
        optimizedUrl: optimizedPdfUrl,
        reportId,
        timestamp: dateNow().toISOString(),
      });
    }
  }, [optimizedPdfUrl, currentPdf, reportId]);

  if (!currentPdf) return null;

  return (
    <ModalPortal>
      <Box className="space-responsive-sm z-modal fixed-modal-dashboard-main flex items-center justify-center bg-black/75">
        <Box
          ref={modalRef}
          className="viewer-container bg-background-surface flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-lg shadow-xl sm:h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          <PdfModalHeader
            title={getReportTitle()}
            onDownload={handleDownload}
            onOpenInNewTab={handleOpenInNewTab}
            onShare={onShare}
            onClose={onClose}
          />
          <PdfModalContent
            optimizedPdfUrl={optimizedPdfUrl}
            reportId={reportId}
            currentPdf={currentPdf}
            isMobile={isMobile}
            onLoad={onLoad}
            onError={onError}
            onOpenInNewTab={handleOpenInNewTab}
          />
        </Box>
      </Box>
    </ModalPortal>
  );
};

export default DocumentPdfModal;
export { DocumentPdfModal };
