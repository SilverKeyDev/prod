import { useLocalization } from "packages/contexts";
import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/features/compare/utils/types";
import { Box, Image } from "packages/ui/components/primitives";

import { ComparisonTableRow } from "./ComparisonTableRow";

type ComparisonTableProps = {
  comparisonData: CompareHomesPropertyDetails[];
  comparisonFields: CompareHomesComparisonField[];
  loadingStates: Record<string, boolean>;
  selectedHomesCount: number;
};

function TableHeader({
  comparisonLabel,
  comparisonData,
  selectedHomesCount,
}: {
  comparisonLabel: string;
  comparisonData: CompareHomesPropertyDetails[];
  selectedHomesCount: number;
}) {
  const thClass =
    selectedHomesCount >= 3
      ? "min-w-20 sm:min-w-24 md:min-w-30"
      : "min-w-24 sm:min-w-30 md:min-w-36";
  return (
    <thead className="bg-card-muted-30">
      <tr>
        <th
          className="bg-card-muted-30 text-text-primary sticky left-0 z-10 px-1 py-1 text-left font-semibold sm:px-2 sm:py-2 md:px-4 md:py-3"
          style={{ width: "25%" }}
        >
          {comparisonLabel}
        </th>
        {comparisonData.map((home) => (
          <th
            key={home.id}
            className={`text-text-primary px-1 py-1 text-center font-semibold sm:px-2 sm:py-2 md:px-4 md:py-3 ${thClass}`}
          >
            <Box className="flex flex-row flex-col items-center gap-1">
              {home.imageUrl && (
                <Image
                  src={home.imageUrl}
                  alt={home.address}
                  className="h-8 w-8 rounded object-cover sm:h-10 sm:w-10 md:h-12 md:w-12"
                />
              )}
              <Box
                className="max-w-full truncate text-xs sm:text-xs md:text-xs"
                title={home.address}
              >
                {home.address}
              </Box>
            </Box>
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function ComparisonTable({
  comparisonData,
  comparisonFields,
  loadingStates,
  selectedHomesCount,
}: ComparisonTableProps) {
  const { t } = useLocalization();
  if (comparisonData.length === 0) return null;
  return (
    <Box className="mb-responsive-md scrollbar-hide overflow-x-auto rounded-lg border">
      <table
        className="w-full border-collapse text-xs sm:text-xs md:text-sm"
        style={{ tableLayout: "fixed" }}
      >
        <TableHeader
          comparisonLabel={t("compare.comparison")}
          comparisonData={comparisonData}
          selectedHomesCount={selectedHomesCount}
        />
        <tbody>
          {comparisonFields.map((field, index) => (
            <ComparisonTableRow
              key={`${field.key}-${index}`}
              field={field}
              index={index}
              comparisonData={comparisonData}
              loadingStates={loadingStates}
              selectedHomesCount={selectedHomesCount}
            />
          ))}
        </tbody>
      </table>
    </Box>
  );
}
