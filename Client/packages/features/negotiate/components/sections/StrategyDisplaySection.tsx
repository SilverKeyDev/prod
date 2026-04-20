import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import SectionBox from "packages/features/negotiate/components/layout/SectionBox";
import { formatStrategyValue } from "packages/features/negotiate/components/layout/StrategyFieldFormatter";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, MiniLogo } from "@/components/ui";

type StrategyDisplaySectionProps = {
  strategyData: unknown;
  onShareJson: () => void;
};
export function StrategyDisplaySection({
  strategyData,
  onShareJson,
}: StrategyDisplaySectionProps): React.JSX.Element | null {
  const { t } = useLocalization();
  if (!strategyData) {
    return null;
  }
  // Handle nested data structure - check if data is under a 'data' property
  const actualData =
    strategyData && typeof strategyData === "object" && !Array.isArray(strategyData)
      ? (strategyData as Record<string, unknown>).data &&
        typeof (strategyData as Record<string, unknown>).data === "object"
        ? ((strategyData as Record<string, unknown>).data as Record<string, unknown>)
        : (strategyData as Record<string, unknown>)
      : null;
  if (!actualData) {
    return null;
  }
  // Sort entries - price_section first
  const sortedEntries = Object.entries(actualData).sort(([keyA], [keyB]) => {
    if (keyA === "price_section") return -1;
    if (keyB === "price_section") return 1;
    return 0;
  });
  return (
    <Box className="space-y-responsive-md">
      {sortedEntries.map(([key, value], index) => {
        // Skip empty or null values
        if (!value || (typeof value === "string" && value.trim() === "")) {
          return null;
        }
        // Skip metadata fields that shouldn't be displayed
        const metadataFields = [
          "section",
          "success",
          "task_id",
          "generated_at",
          "filename",
          "strategy_id",
        ];
        if (metadataFields.includes(key.toLowerCase())) {
          return null;
        }
        // Skip opening_offer from price_section since it's displayed above
        let processedValue = value;
        if (key === "price_section" && typeof value === "object" && value !== null) {
          const priceSectionObj = value as Record<string, unknown>;
          if (priceSectionObj.opening_offer) {
            // Create a new object without opening_offer
            const { opening_offer: _opening_offer, ...priceSectionWithoutOffer } = priceSectionObj;
            processedValue = priceSectionWithoutOffer;
          }
        }
        const formattedValue = formatStrategyValue(processedValue, t);
        return (
          <SectionBox key={key}>
            {/* Add share button to the first card */}
            {index === 0 && (
              <Box className="border-border mb-4 flex items-center justify-between border-b pb-4">
                <Box className="flex items-center gap-3">
                  <MiniLogo size="sm" />
                </Box>
                <Box className="gap-responsive-sm flex">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onShareJson}
                    icon={<Icon name="share" className="mobile-icon-xs" />}
                    label={t("negotiate.strategy.share")}
                  >
                    {t("negotiate.strategy.share")}
                  </Button>
                </Box>
              </Box>
            )}
            <Box className="text-text-secondary">
              {typeof formattedValue === "string" ? (
                <BodyText as="p" size="sm" className="leading-relaxed">
                  {formattedValue}
                </BodyText>
              ) : (
                <Box>{formattedValue}</Box>
              )}
            </Box>
          </SectionBox>
        );
      })}
    </Box>
  );
}
