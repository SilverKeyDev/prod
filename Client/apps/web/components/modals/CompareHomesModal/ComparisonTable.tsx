import type { PropertyDetails, ComparisonField } from "./types";

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
      <table className="w-full border-collapse text-[10px] sm:text-xs md:text-sm">
        <thead className="bg-beige/30">
          <tr>
            <th className="sticky left-0 z-10 bg-beige/30 px-1 py-1 text-left font-semibold text-black sm:px-2 sm:py-2 md:px-4 md:py-3">
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
            const bgClass = isEven ? "bg-white" : "bg-beige/5";
            const stickyBgClass = isEven ? "bg-white/80" : "bg-beige/5";
            const isPrice = field.key === "price";

            return (
              <tr
                key={field.key}
                className={`border-t border-gray-200 ${bgClass}`}
              >
                <td
                  className={`sticky left-0 z-10 ${stickyBgClass} px-1 py-1 font-medium text-black backdrop-blur sm:px-2 sm:py-2 md:px-4 md:py-3`}
                >
                  {field.label}
                </td>
                {comparisonData.map((home) => {
                  const value = field.getValue(home);
                  const isLoading = loadingStates[home.id] || home.isLoading;

                  return (
                    <td
                      key={`${field.key}-${home.id}`}
                      className={`px-1 py-1 text-center sm:px-2 sm:py-2 md:px-4 md:py-3 ${
                        selectedHomesCount >= 3
                          ? "min-w-[80px] sm:min-w-[100px] md:min-w-[120px]"
                          : "min-w-[100px] sm:min-w-[120px] md:min-w-[150px]"
                      } ${isPrice ? "font-medium text-brown" : "text-black/90"}`}
                    >
                      {isLoading && value === "—" ? (
                        <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400">
                          Loading...
                        </span>
                      ) : (
                        <span
                          className="text-[9px] sm:text-[10px] md:text-xs whitespace-pre-wrap break-words"
                          title={value.length > 50 ? value : undefined}
                        >
                          {value}
                        </span>
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
