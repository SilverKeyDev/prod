import React, { useEffect, useMemo, useRef } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { useResponsive } from "packages/hooks/ui";
import { usePdfIframeHandlers } from "packages/hooks/ui/documents/pdf/usePdfIframeHandlers";
import { usePdfModalDiagnostics } from "packages/hooks/ui/documents/pdf/usePdfModalDiagnostics";
import { dateNow } from "packages/utils/core/date";
import { generateOptimizedPdfUrl } from "packages/utils/domain/documents/pdf";
import { formatFilenameToAddress } from "packages/utils/domain/search/address";

import { PdfModalContent } from "./PdfModalContent";
import { PdfModalHeader } from "./PdfModalHeader";

export type PdfModalProps = {
  currentPdf: string | null;
  currentReportAddress: string | null;
  reportId?: string | null;
  onClose: () => void;
  onShare?: () => void;
};

const PdfModal: React.FC<PdfModalProps> = ({
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const getReportTitle = () => {
    if (currentReportAddress)
      return formatFilenameToAddress(currentReportAddress);
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

  const optimizedPdfUrl = useMemo(() => {
    if (!currentPdf) return null;
    return generateOptimizedPdfUrl(currentPdf, {}, reportId || undefined);
  }, [currentPdf, reportId]);

  const { onLoad, onError } = usePdfIframeHandlers(
    reportId,
    currentReportAddress,
    currentPdf,
  );

  useEffect(() => {
    if (optimizedPdfUrl) {
      log.debug(
        LOG_CATEGORIES.HTTP,
        "[PdfModal] Generated optimized URL for iframe",
        {
          originalUrl: currentPdf,
          optimizedUrl: optimizedPdfUrl,
          reportId,
          timestamp: dateNow().toISOString(),
        },
      );
    }
  }, [optimizedPdfUrl, currentPdf, reportId]);

  if (!currentPdf) return null;

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
      </div>
    </div>
  );
};

export default PdfModal;
