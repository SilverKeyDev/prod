import type { PropertyDetails, ComparisonField } from "./types";
import { KeyTurnLoader } from "../../ui";
import { DEFAULT_REPORT_SECTIONS } from "../../../features/onboardpersonalize/lib/constants";

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

            // Check if this is the first field after a section header
            const prevField = index > 0 ? comparisonFields[index - 1] : null;
            const isFirstFieldAfterSection =
              prevField?.isSectionHeader === true;

            const bgClass = isSectionHeader
              ? "bg-brown/10"
              : isEven
                ? "bg-white"
                : "bg-beige/5";
            const stickyBgClass = isSectionHeader
              ? "bg-brown/10"
              : isEven
                ? "bg-white/80"
                : "bg-beige/5";
            const isPrice = field.key === "price";

            return (
              <tr
                key={field.key}
                className={`relative ${bgClass} ${
                  isSectionHeader
                    ? "border-t-[4px] border-brown border-b-[2px] border-brown/30"
                    : isFirstFieldAfterSection
                      ? "border-t border-brown/20"
                      : "border-t border-gray-200"
                }`}
              >
                <td
                  className={`sticky left-0 z-10 ${stickyBgClass} px-1 py-1 font-medium text-black backdrop-blur sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                    isSectionHeader
                      ? "bg-brown/10 font-bold text-brown text-sm sm:text-base md:text-lg py-2 sm:py-3 md:py-4"
                      : isSectionField
                        ? "pl-4 sm:pl-6 md:pl-8 text-xs sm:text-sm"
                        : ""
                  }`}
                  style={{ width: "25%" }}
                >
                  {isSectionField && (
                    <span className="text-brown/60 mr-1">└</span>
                  )}
                  <div
                    className={`flex items-center gap-2 ${isSectionHeader ? "flex-col sm:flex-row items-start sm:items-center" : ""}`}
                  >
                    {isSectionHeader && field.sectionKey && (
                      <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-brown/20 text-brown font-bold text-xs sm:text-sm md:text-base mr-0 sm:mr-2 flex-shrink-0">
                        {DEFAULT_REPORT_SECTIONS.findIndex(
                          (s: { key: string }) => s.key === field.sectionKey
                        ) + 1}
                      </span>
                    )}
                    <span className={isSectionHeader ? "font-bold" : ""}>
                      {field.label}
                    </span>
                    {isSectionHeader && field.isLoading && (
                      <KeyTurnLoader message="" variant="gray" />
                    )}
                  </div>
                </td>
                {comparisonData.map((home) => {
                  const value = field.getValue(home);
                  const isLoading = loadingStates[home.id] || home.isLoading;

                  return (
                    <td
                      key={`${field.key}-${home.id}`}
                      className={`relative px-1 py-1 text-center sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                        selectedHomesCount >= 3
                          ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                          : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                      } ${isPrice ? "font-medium text-brown" : "text-black/90"} ${
                        isSectionHeader ? "bg-brown/10" : ""
                      }`}
                    >
                      {/* Loading overlay - covers everything when section is loading */}
                      {isSectionHeader && field.isLoading ? (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-sm">
                          <KeyTurnLoader message="" variant="gray" />
                        </div>
                      ) : null}
                      {/* Show content (will be visible if not loading, or dimmed if loading) */}
                      <div
                        className={
                          isSectionHeader && field.isLoading ? "opacity-30" : ""
                        }
                      >
                        {isLoading && value === "—" && !isSectionHeader ? (
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
