import React from "react";

import { Icon } from "@ui/icons";

import { IconButton, MiniLogo, Title } from "@/components/ui";
export type PdfModalHeaderProps = {
  title: string;
  onDownload: () => void;
  onOpenInNewTab: () => void;
  onShare?: () => void;
  onClose: () => void;
};
const ExternalLinkIcon = () => (
  <svg
    className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
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
);
const headerButtonClass =
  "text-white hover:bg-primary-muted rounded-lg p-2 transition-colors duration-200";
export const PdfModalHeader: React.FC<PdfModalHeaderProps> = ({
  title,
  onDownload,
  onOpenInNewTab,
  onShare,
  onClose,
}) => (
  <div
    className="from-primary to-primary-hover flex items-center justify-between bg-gradient-to-r px-4 py-3"
    style={{ borderRadius: "24px 24px 0 0" }}
  >
    <div className="gap-responsive-sm flex min-w-0 flex-1 items-center">
      <div className="flex-shrink-0 text-white" style={{ filter: "brightness(0) invert(1)" }}>
        <MiniLogo className="mobile-icon-lg" />
      </div>
      <Title size="lg" as="h2" className="min-w-0 truncate font-semibold text-white">
        {title}
      </Title>
    </div>

    <div className="gap-responsive-sm flex flex-shrink-0 items-center">
      <IconButton
        icon={
          <Icon
            name="download"
            className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
          />
        }
        onClick={onDownload}
        title="Download PDF"
        aria-label="Download PDF"
        className={`hidden sm:flex ${headerButtonClass}`}
        variant="ghost"
      />
      <IconButton
        icon={<ExternalLinkIcon />}
        onClick={onOpenInNewTab}
        title="Open in New Tab"
        aria-label="Open in New Tab"
        className={headerButtonClass}
        variant="ghost"
      />
      {onShare && (
        <IconButton
          icon={
            <Icon
              name="share"
              className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
            />
          }
          onClick={onShare}
          title="Share Report"
          aria-label="Share Report"
          className={`hidden sm:flex ${headerButtonClass}`}
          variant="ghost"
        />
      )}
      <IconButton
        icon={
          <Icon
            name="x"
            className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
          />
        }
        onClick={onClose}
        title="Close"
        aria-label="Close"
        className={headerButtonClass}
        variant="ghost"
      />
    </div>
  </div>
);
