import type { SearchResult } from "packages/features/search/types";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

type Props = {
  results: SearchResult[];
  colorMode?: string;
};

/** Native / default: map pins as text until a native map panel ships. */
export function InventoryMapPanel({ results }: Props) {
  return (
    <Box
      className="border-border bg-background-surface flex h-96 flex-col justify-center gap-2 rounded-xl border p-4"
      data-testid="inventory-map"
    >
      <BodyText size="sm" muted>
        Map view is available on web. {results.length} listing
        {results.length === 1 ? "" : "s"} in view.
      </BodyText>
    </Box>
  );
}
