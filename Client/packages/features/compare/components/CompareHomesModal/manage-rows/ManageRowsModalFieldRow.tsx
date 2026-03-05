import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { CompareHomesComparisonField } from "packages/features/compare/utils/types";
import { BodyText, Input, Label } from "packages/ui/components/index.web";
type ManageRowsModalFieldRowProps = {
  field: CompareHomesComparisonField;
  index: number;
  totalCount: number;
  isOmitted: boolean;
  hasData: boolean;
  isManuallyEnabled: boolean;
  onToggle: (checked: boolean) => void;
};
export function ManageRowsModalFieldRow({
  field,
  index,
  totalCount,
  isOmitted,
  hasData,
  isManuallyEnabled,
  onToggle,
}: ManageRowsModalFieldRowProps) {
  const { t } = useLocalization();
  const isAutoOmitted = !hasData && !isManuallyEnabled;
  return (
    <Label
      className={`hover:bg-beige/20 flex cursor-pointer items-center space-x-3 p-4 transition-colors ${index !== totalCount - 1 ? "border-b border-gray-100" : ""}`}
    >
      <div className="relative">
        <Input
          type="checkbox"
          checked={!isOmitted}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onToggle(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 ${
            !isOmitted
              ? "border-beige bg-beige text-white shadow-sm"
              : "border-beige hover:border-beige/50 bg-white"
          }`}
        >
          {!isOmitted && <Icon name="check" className="h-3 w-3 fill-current" />}
        </div>
      </div>
      <div className="flex-1">
        <BodyText
          as="span"
          className={`text-sm font-medium transition-colors ${isOmitted ? "text-black/40 line-through" : "text-black"}`}
        >
          {field.label}
        </BodyText>
        {isAutoOmitted && (
          <BodyText as="span" className="ml-2 text-xs text-gray-500">
            {t("compare.auto_hidden_no_data")}
          </BodyText>
        )}
        {!hasData && isManuallyEnabled && (
          <BodyText as="span" className="ml-2 text-xs text-gray-500">
            {t("compare.manually_enabled")}
          </BodyText>
        )}
      </div>
    </Label>
  );
}
