import React from "react";

import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";

import { BodyText } from "@/components/ui";
type CompareHomesModalHeaderProps = {
  onClose: () => void;
  onManageRows: () => void;
  onExportCSV: () => void;
  onShareCSV: () => void;
  selectedCount: number;
  disabled: boolean;
};
export function CompareHomesModalHeader({
  onClose,
  onManageRows,
  onExportCSV,
  onShareCSV,
  disabled,
}: CompareHomesModalHeaderProps) {
  const { t } = useLocalization();
  return (
    <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Icon name="git-compare" className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
        <BodyText as="span" className="truncate text-base font-medium text-gray-900 sm:text-lg">
          {t("compare.compare_properties")}
        </BodyText>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        <IconButton
          onClick={onManageRows}
          variant="ghost"
          size="sm"
          icon={<Icon name="settings-2" className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={disabled}
          className="touch-manipulation text-gray-600 hover:text-gray-900"
          label={t("compare.manage_aria")}
        />
        <IconButton
          onClick={onExportCSV}
          variant="ghost"
          size="sm"
          icon={<Icon name="download" className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={disabled}
          className="touch-manipulation text-gray-600 hover:text-gray-900"
          label={t("compare.export_aria")}
        />
        <IconButton
          onClick={onShareCSV}
          variant="ghost"
          size="sm"
          icon={<Icon name="share" className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={disabled}
          className="text-gold hover:text-gold/80 touch-manipulation"
          label={t("compare.share_aria")}
        />
        <IconButton
          variant="ghost"
          size="sm"
          icon={<Icon name="x" className="h-4 w-4 sm:h-5 sm:w-5" />}
          onClick={onClose}
          className="flex-shrink-0 touch-manipulation text-gray-400 hover:text-gray-500"
          label={t("compare.close_modal_aria")}
        />
      </div>
    </div>
  );
}
