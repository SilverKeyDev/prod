import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { BodyText, Button, Title } from "packages/ui/components/index.web";

import {
  getPdfIframeAllow,
  getPdfIframeSandbox,
  getPdfViewerStyles,
} from "@/features/documents/utils/pdf";
export type PdfModalContentProps = {
  optimizedPdfUrl: string | null;
  reportId?: string | null;
  currentPdf: string | null;
  isMobile: boolean;
  onLoad: (e: React.SyntheticEvent<HTMLIFrameElement>) => void;
  onError: (e: React.SyntheticEvent<HTMLIFrameElement>) => void;
  onOpenInNewTab: () => void;
};
export const PdfModalContent: React.FC<PdfModalContentProps> = ({
  optimizedPdfUrl,
  reportId,
  isMobile,
  onLoad,
  onError,
  onOpenInNewTab,
}) => {
  const { t } = useLocalization();
  return (
    <div className="relative flex-1 overflow-hidden" style={getPdfViewerStyles()}>
      {isMobile && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 p-6 text-center sm:hidden">
          <div className="mb-4">
            <svg
              className="text-olive mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <Title as="h3" size="lg" className="mb-2 font-semibold text-gray-900">
            {t("pdf.viewer_title")}
          </Title>
          <BodyText as="p" size="sm" className="mb-6 text-gray-600">
            {t("pdf.mobile_message")}
          </BodyText>
          <Button
            variant="primary"
            onClick={onOpenInNewTab}
            className="from-gold to-gold/90 hover:from-gold/90 hover:to-gold/80 group flex items-center gap-2 bg-gradient-to-r font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
          >
            <BodyText as="span">{t("pdf.open_in_new_tab")}</BodyText>
            <Icon
              name="external-link"
              className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </Button>
        </div>
      )}
      <iframe
        src={optimizedPdfUrl || ""}
        className="h-full w-full border-0"
        title={t("pdf.viewer_title")}
        allow={getPdfIframeAllow()}
        {...(reportId ? {} : { sandbox: getPdfIframeSandbox(false) })}
        referrerPolicy="no-referrer"
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  );
};
