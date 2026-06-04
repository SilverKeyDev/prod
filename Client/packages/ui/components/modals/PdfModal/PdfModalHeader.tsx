import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
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

const headerButtonClass =
  "text-text-secondary hover:bg-accent-muted hover:text-text-primary flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 transition-colors duration-200 touch-manipulation";

const HeaderIconButton = ({
  icon,
  onClick,
  label,
  className = "",
}: {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  className?: string;
}) => (
  <IconButton
    icon={icon}
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`${headerButtonClass} ${className}`.trim()}
    variant="ghost"
  />
);

export const PdfModalHeader: React.FC<PdfModalHeaderProps> = ({
  title,
  onDownload,
  onOpenInNewTab,
  onShare,
  onClose,
}) => {
  const { t } = useLocalization();
  const dl = t("pdf.download");
  const openTabLabel = t("pdf.open_in_new_tab");
  const shareReport = t("pdf.share_report");
  const closeLabel = t("common.close");

  const actionButtons = (
    <>
      <HeaderIconButton
        icon={
          <Icon
            name="download"
            className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 sm:h-6 sm:w-6"
          />
        }
        onClick={onDownload}
        label={dl}
      />
      <HeaderIconButton
        icon={
          <Icon
            name="external-link"
            className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 sm:h-6 sm:w-6"
          />
        }
        onClick={onOpenInNewTab}
        label={openTabLabel}
      />
      {onShare ? (
        <HeaderIconButton
          icon={
            <Icon
              name="share"
              className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 sm:h-6 sm:w-6"
            />
          }
          onClick={onShare}
          label={shareReport}
          className="hidden sm:flex"
        />
      ) : null}
    </>
  );

  return (
    <Box className="border-border bg-background-surface flex w-full min-w-0 flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
      <Box className="flex w-full min-w-0 items-start justify-between gap-2 sm:flex-1 sm:items-center">
        <Box className="gap-responsive-sm flex min-w-0 flex-1 items-center">
          <Box className="hidden flex-shrink-0 sm:block">
            <MiniLogo className="mobile-icon-lg" />
          </Box>
          <Title
            size="md"
            as="h2"
            className="text-text-primary line-clamp-2 min-w-0 flex-1 break-words font-semibold sm:line-clamp-1 sm:truncate sm:text-lg"
          >
            {title}
          </Title>
        </Box>
        <HeaderIconButton
          icon={
            <Icon
              name="x"
              className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
            />
          }
          onClick={onClose}
          label={closeLabel}
          className="flex-shrink-0 sm:hidden"
        />
      </Box>

      <Box className="flex w-full min-w-0 flex-shrink-0 items-center justify-end gap-0.5 sm:w-auto sm:gap-1">
        {actionButtons}
        <HeaderIconButton
          icon={
            <Icon
              name="x"
              className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
            />
          }
          onClick={onClose}
          label={closeLabel}
          className="hidden sm:flex"
        />
      </Box>
    </Box>
  );
};
