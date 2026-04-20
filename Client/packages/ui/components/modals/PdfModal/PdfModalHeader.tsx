import React from "react";

import { Icon } from "@ui/icons";

import MiniLogo from "packages/ui/components/asset/MiniLogo";
import IconButton from "packages/ui/components/button/IconButton";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
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
  "text-text-secondary hover:bg-accent-muted hover:text-text-primary rounded-md p-2 transition-colors duration-200";
export const PdfModalHeader: React.FC<PdfModalHeaderProps> = ({
  title,
  onDownload,
  onOpenInNewTab,
  onShare,
  onClose,
}) => (
  <Box className="border-border bg-background-surface flex items-center justify-between border-b px-4 py-3">
    <Box className="gap-responsive-sm flex min-w-0 flex-1 items-center">
      <Box className="flex-shrink-0">
        <MiniLogo className="mobile-icon-lg" />
      </Box>
      <Title size="lg" as="h2" className="text-text-primary min-w-0 truncate font-semibold">
        {title}
      </Title>
    </Box>

    <Box className="gap-responsive-sm flex flex-shrink-0 items-center">
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
    </Box>
  </Box>
);
