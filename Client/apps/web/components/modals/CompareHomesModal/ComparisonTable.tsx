import type { PropertyDetails, ComparisonField } from "./types";
import { KeyTurnLoader } from "../../ui";
import { DEFAULT_REPORT_SECTIONS } from "../../../features/onboardpersonalize/lib/constants";
import { renderSectionIcon } from "./sectionIcons";

type ComparisonTableProps = {
  comparisonData: PropertyDetails[];
  comparisonFields: ComparisonField[];
  loadingStates: Record<string, boolean>;
  selectedHomesCount: number;
};

export function ComparisonTable({
  comparisonData,
  comparisonFields,
  loadingStates,
  selectedHomesCount,
}: ComparisonTableProps) {
  if (comparisonData.length === 0) {
    return null;
  }

  return (
    <div className="mb-responsive-md scrollbar-hide overflow-x-auto rounded-lg border">
      <table
        className="w-full border-collapse text-[10px] sm:text-xs md:text-sm"
        style={{ tableLayout: "fixed" }}
      >
        <thead className="bg-beige/30">
          <tr>
            <th
              className="sticky left-0 z-10 bg-beige/30 px-1 py-1 text-left font-semibold text-black sm:px-2 sm:py-2 md:px-4 md:py-3"
              style={{ width: "25%" }}
            >
              Comparison
            </th>
            {comparisonData.map((home) => (
              <th
                key={home.id}
                className={`px-1 py-1 text-center font-semibold text-black sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                  selectedHomesCount >= 3
                    ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                    : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  {home.imageUrl && (
                    <img
                      src={home.imageUrl}
                      alt={home.address}
                      className="h-8 w-8 rounded object-cover sm:h-10 sm:w-10 md:h-12 md:w-12"
                    />
                  )}
                  <div
                    className="max-w-full truncate text-[9px] sm:text-[10px] md:text-xs"
                    title={home.address}
                  >
                    {home.address}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonFields.map((field, index) => {
            const isEven = index % 2 === 0;
            const isSectionHeader = field.isSectionHeader === true;
            const isSectionField = field.sectionKey && !isSectionHeader;

            const bgClass = isSectionHeader
              ? "bg-beige/20"
              : isEven
                ? "bg-white"
                : "bg-beige/5";
            const stickyBgClass = isSectionHeader
              ? "bg-beige/20"
              : isEven
                ? "bg-white/80"
                : "bg-beige/5";
            const isPrice = field.key === "price";

            // Get section title for section headers
            const sectionTitle =
              isSectionHeader && field.sectionKey
                ? DEFAULT_REPORT_SECTIONS.find(
                    (s: { key: string }) => s.key === field.sectionKey
                  )?.label || field.label
                : null;

            // Render row (section headers and regular fields use the same structure)
            return (
              <tr
                key={`${isSectionHeader ? "section-header" : "field"}-${field.key}-${index}`}
                className={`relative ${
                  isSectionHeader
                    ? "bg-beige/20"
                    : `${bgClass} border-t border-gray-200`
                }`}
              >
                <td
                  className={`sticky left-0 z-10 ${stickyBgClass} backdrop-blur ${
                    isSectionHeader
                      ? "px-2 py-2.5 font-semibold text-xs sm:text-sm md:text-base sm:px-3 sm:py-3 md:px-4 md:py-3.5 border-t-2 border-b border-gray-200"
                      : `px-1 py-1 font-medium text-black sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                          isSectionField
                            ? "pl-4 sm:pl-6 md:pl-8 text-xs sm:text-sm"
                            : ""
                        }`
                  }`}
                  style={{ width: "25%" }}
                >
                  {isSectionHeader ? (
                    <div className="flex items-center gap-2">
                      {field.sectionKey &&
                        renderSectionIcon(
                          field.sectionKey,
                          "h-4 w-4 sm:h-5 sm:w-5 text-beige"
                        )}
                      <span className="text-beige">{sectionTitle}</span>
                    </div>
                  ) : (
                    <span>{field.label}</span>
                  )}
                </td>
                {comparisonData.map((home) => {
                  const value = field.getValue(home);
                  const isLoading = loadingStates[home.id] || home.isLoading;

                  return (
                    <td
                      key={`${field.key}-${home.id}`}
                      className={`relative px-1 py-1 sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                        selectedHomesCount >= 3
                          ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                          : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                      } ${
                        isSectionHeader
                          ? "bg-beige/20 border-t-2 border-b border-neutral-200"
                          : `${isPrice ? "font-medium text-beige" : "text-black/90"} text-center`
                      }`}
                    >
                      {isSectionHeader ? (
                        // Empty cell for section headers
                        <div />
                      ) : (
                        <div>
                          {isLoading && value === "—" ? (
                            <div className="flex items-center justify-center">
                              <KeyTurnLoader message="" variant="gray" />
                            </div>
                          ) : (
                            <span
                              className="text-[9px] sm:text-[10px] md:text-xs whitespace-pre-wrap break-words"
                              title={value.length > 50 ? value : undefined}
                            >
                              {value}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
