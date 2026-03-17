import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { CompareHomesComparisonField } from "packages/features/compare/utils/types";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Input, Label } from "@/components/ui";
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
      // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
      className={`hover:bg-bg-card-subtle active:bg-bg-card-muted flex cursor-pointer flex-row items-center gap-3 p-4 active:opacity-90 ${index !== totalCount - 1 ? "border-border border-b" : ""}`}
    >
      <Box className="relative">
        <Input
          type="checkbox"
          checked={!isOmitted}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onToggle(e.target.checked)}
          className="sr-only"
        />
        <Box
          // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
          className={`flex h-5 w-5 flex-row items-center justify-center rounded border-2 ${!isOmitted ? "border-border-input bg-border-input text-white shadow-sm" : "border-border-input hover:border-border-card-muted active:border-border-card-subtle bg-background-surface active:opacity-90"}`}
        >
          {!isOmitted && <Icon name="check" className="h-3 w-3 fill-current" />}
        </Box>
      </Box>
      <Box className="flex-1">
        <BodyText
          as="span"
          // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
          className={`text-sm font-medium ${isOmitted ? "text-text-secondary line-through" : "text-text-primary"}`}
        >
          {field.label}
        </BodyText>
        {isAutoOmitted && (
          <BodyText as="span" className="text-text-secondary ml-2 text-xs">
            {t("compare.auto_hidden_no_data")}
          </BodyText>
        )}
        {!hasData && isManuallyEnabled && (
          <BodyText as="span" className="text-text-secondary ml-2 text-xs">
            {t("compare.manually_enabled")}
          </BodyText>
        )}
      </Box>
    </Label>
  );
}
