import React from "react";
import { Share2 } from "lucide-react";
import { Button } from "../../components/ui";
import { SectionBox } from "./index";
import { formatStrategyValue } from "./StrategyFieldFormatter";

type StrategyDisplaySectionProps = {
  strategyData: unknown;
  onShareJson: () => void;
};

export function StrategyDisplaySection({
  strategyData,
  onShareJson,
}: StrategyDisplaySectionProps): React.JSX.Element | null {
  if (!strategyData) {
    return null;
  }

  // Handle nested data structure - check if data is under a 'data' property
  const actualData =
    strategyData &&
    typeof strategyData === "object" &&
    !Array.isArray(strategyData)
      ? (strategyData as Record<string, unknown>).data &&
        typeof (strategyData as Record<string, unknown>).data === "object"
        ? ((strategyData as Record<string, unknown>).data as Record<
            string,
            unknown
          >)
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
    <div className="space-y-responsive-md">
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
        if (
          key === "price_section" &&
          typeof value === "object" &&
          value !== null
        ) {
          const priceSectionObj = value as Record<string, unknown>;
          if (priceSectionObj.opening_offer) {
            // Create a new object without opening_offer
            const { opening_offer, ...priceSectionWithoutOffer } =
              priceSectionObj;
            processedValue = priceSectionWithoutOffer;
          }
        }

        const formattedValue = formatStrategyValue(processedValue);

        return (
          <SectionBox key={key}>
            {/* Add share button to the first card */}
            {index === 0 && (
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/minilogo.png"
                    alt="SilverKey"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="gap-responsive-sm flex">
                  <Button
                    variant="olive"
                    size="sm"
                    onClick={onShareJson}
                    icon={<Share2 className="mobile-icon-xs" />}
                  >
                    Share
                  </Button>
                </div>
              </div>
            )}
            <div className="text-navy/80">
              {typeof formattedValue === "string" ? (
                <p className="text-sm leading-relaxed">{formattedValue}</p>
              ) : (
                <div>{formattedValue}</div>
              )}
            </div>
          </SectionBox>
        );
      })}
    </div>
  );
}

