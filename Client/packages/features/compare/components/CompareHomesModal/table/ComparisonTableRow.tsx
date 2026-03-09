import { renderSectionIcon } from "packages/features/compare/components/CompareHomesModal/sectionIcons";
import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/features/compare/utils/types";

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
  const bgClass = isSectionHeader ? "bg-beige/20" : isEven ? "bg-white" : "bg-beige/5";
  const stickyBgClass = isSectionHeader ? "bg-beige/20" : isEven ? "bg-white/80" : "bg-beige/5";
  const labelCellClass = isSectionHeader
    ? "px-2 py-2.5 font-semibold text-xs sm:text-sm md:text-base sm:px-3 sm:py-3 md:px-4 md:py-3.5 border-t-2 border-b border-gray-200"
    : `px-1 py-1 font-medium text-black sm:px-2 sm:py-2 md:px-4 md:py-3 ${
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
        isSectionHeader ? "bg-beige/20" : `${bgClass} border-t border-gray-200`
      }`}
    >
      <td
        className={`sticky left-0 z-10 ${stickyBgClass} backdrop-blur ${labelCellClass}`}
        style={{ width: "25%" }}
      >
        {isSectionHeader ? (
          <div className="flex items-center gap-2">
            {field.sectionKey &&
              renderSectionIcon(field.sectionKey, "h-4 w-4 sm:h-5 sm:w-5 text-beige")}
            <BodyText as="span" className="text-beige">
              {sectionTitle}
            </BodyText>
          </div>
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
                ? "bg-beige/20 border-b border-t-2 border-neutral-200"
                : `${isPrice ? "text-beige font-medium" : "text-black/90"} text-center`
            }`}
          >
            {isSectionHeader ? (
              <div />
            ) : (
              <div>
                {isLoading && value === "—" ? (
                  <div className="flex items-center justify-center">
                    <KeyTurnLoader message="" variant="gray" />
                  </div>
                ) : (
                  <BodyText
                    as="span"
                    className="whitespace-pre-wrap break-words text-xs sm:text-xs md:text-xs"
                  >
                    {value}
                  </BodyText>
                )}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}
