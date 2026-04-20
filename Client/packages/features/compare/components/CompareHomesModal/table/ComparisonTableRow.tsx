import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/features/compare/types/compareHomes";
import { renderReportSectionIcon as renderSectionIcon } from "packages/ui/components/icons/renderReportSectionIcon";
import { Box } from "packages/ui/components/primitives";

import { BodyText, KeyTurnLoader } from "@/components/ui";
import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

type ComparisonTableRowProps = {
  field: CompareHomesComparisonField;
  index: number;
  comparisonData: CompareHomesPropertyDetails[];
  loadingStates: Record<string, boolean>;
  selectedHomesCount: number;
};

function getRowClasses(isSectionHeader: boolean, isEven: boolean, isSectionField: boolean) {
  const bgClass = isSectionHeader
    ? "bg-accent-muted"
    : isEven
      ? "bg-background-surface"
      : "bg-accent-muted";
  const stickyBgClass = isSectionHeader
    ? "bg-accent-muted"
    : isEven
      ? "bg-background-surface"
      : "bg-accent-muted";
  const labelCellClass = isSectionHeader
    ? "px-2 py-2.5 font-semibold text-xs sm:text-sm md:text-base sm:px-3 sm:py-3 md:px-4 md:py-3.5 border-t-2 border-b border-border"
    : `px-1 py-1 font-medium text-text-primary sm:px-2 sm:py-2 md:px-4 md:py-3 ${
        isSectionField ? "pl-4 sm:pl-6 md:pl-8 text-xs sm:text-sm" : ""
      }`;
  return { bgClass, stickyBgClass, labelCellClass };
}

export function ComparisonTableRow({
  field,
  index,
  comparisonData,
  loadingStates,
  selectedHomesCount,
}: ComparisonTableRowProps) {
  const isEven = index % 2 === 0;
  const isSectionHeader = field.isSectionHeader === true;
  const isSectionField = Boolean(field.sectionKey && !isSectionHeader);
  const isPrice = field.key === "price";

  const sectionTitle =
    isSectionHeader && field.sectionKey
      ? DEFAULT_REPORT_SECTIONS.find((s: { key: string }) => s.key === field.sectionKey)?.label ||
        field.label
      : null;

  const { bgClass, stickyBgClass, labelCellClass } = getRowClasses(
    isSectionHeader,
    isEven,
    isSectionField
  );

  const cellMinWidth =
    selectedHomesCount >= 3
      ? "min-w-20 sm:min-w-24 md:min-w-30"
      : "min-w-24 sm:min-w-30 md:min-w-36";

  return (
    <tr
      key={`${isSectionHeader ? "section-header" : "field"}-${field.key}-${index}`}
      className={`relative ${
        isSectionHeader ? "bg-accent-muted" : `${bgClass} border-border border-t`
      }`}
    >
      <td
        className={`sticky left-0 z-10 ${stickyBgClass} backdrop-blur ${labelCellClass}`}
        style={{ width: "25%" }}
      >
        {isSectionHeader ? (
          <Box className="flex items-center gap-2">
            {field.sectionKey &&
              renderSectionIcon(field.sectionKey, "h-4 w-4 sm:h-5 sm:w-5 text-text-secondary")}
            <BodyText as="span" className="text-text-secondary">
              {sectionTitle}
            </BodyText>
          </Box>
        ) : (
          <BodyText as="span">{field.label}</BodyText>
        )}
      </td>
      {comparisonData.map((home) => {
        const value = field.getValue(home);
        const isLoading = loadingStates[home.id] || home.isLoading;
        return (
          <td
            key={`${field.key}-${home.id}`}
            className={`relative px-1 py-1 sm:px-2 sm:py-2 md:px-4 md:py-3 ${cellMinWidth} ${
              isSectionHeader
                ? "bg-accent-muted border-border border-b border-t-2"
                : `${isPrice ? "text-accent font-medium" : "text-text-primary"} text-center`
            }`}
          >
            {isSectionHeader ? (
              <Box />
            ) : (
              <Box>
                {isLoading && value === "-" ? (
                  <Box className="flex items-center justify-center">
                    <KeyTurnLoader message="" variant="gray" />
                  </Box>
                ) : (
                  <BodyText
                    as="span"
                    className="whitespace-pre-wrap break-words text-xs sm:text-xs md:text-xs"
                  >
                    {value}
                  </BodyText>
                )}
              </Box>
            )}
          </td>
        );
      })}
    </tr>
  );
}
