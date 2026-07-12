import { useMemo, useState } from "react";

import {
  type InventoryStatusFilter,
  useBrokerageInventory,
} from "packages/features/brokerage/hooks/useBrokerageInventory";
import { inventoryListingsToSearchResults } from "packages/features/brokerage/utils/inventory/inventoryListingToSearchResult";
import { SidebarList } from "packages/features/search/components/list/SidebarList.web";
import type { SearchResult } from "packages/features/search/types";
import { getPageIndexForProperty } from "packages/features/search/types/search/map/mapCardFocus";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { InventoryMapPanel } from "./InventoryMapPanel";

const FILTERS: { id: InventoryStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "sold", label: "Sold" },
];

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return `$${Math.round(price / 1000)}K`;
}

function InventoryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Box className="flex flex-col gap-0.5">
      <BodyText size="xs" muted>
        {label}
      </BodyText>
      <Title size="sm" as="span">
        {value}
      </Title>
    </Box>
  );
}

/**
 * Headerless portfolio block for the brokerage Market analytics tab.
 * Reuses Search sidebar home cards + map marker chrome.
 */
export function BrokerageInventoryPanel() {
  const { listings, summary, statusFilter, setStatusFilter } = useBrokerageInventory();
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const searchResults = useMemo(() => inventoryListingsToSearchResults(listings), [listings]);

  const handleNavigate = (property: SearchResult) => {
    setSelectedListingId(property.id);
    setCurrentPage(getPageIndexForProperty(searchResults, property.id));
  };

  return (
    <Box className="flex min-h-0 w-full flex-col gap-4" data-testid="brokerage-inventory-panel">
      <Box
        className="border-border bg-background-surface flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border px-4 py-3"
        data-testid="inventory-kpi-strip"
      >
        <Box className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <InventoryStat label="Total" value={summary.total_count} />
          <InventoryStat label="Active" value={summary.active_count} />
          <InventoryStat label="Sold" value={summary.sold_count} />
          <InventoryStat
            label="Median price"
            value={summary.median_price != null ? formatPrice(summary.median_price) : "—"}
          />
        </Box>

        <Box className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              type="button"
              variant="outline"
              size="sm"
              onPress={() => {
                setStatusFilter(f.id);
                setSelectedListingId(null);
                setCurrentPage(0);
              }}
              className={`rounded-lg border px-2.5 py-1 text-sm ${
                statusFilter === f.id
                  ? "border-border-strong bg-background font-semibold"
                  : "border-border bg-background"
              }`}
              data-testid={`inventory-filter-${f.id}`}
            >
              {f.label}
            </Button>
          ))}
        </Box>
      </Box>

      <Box
        className="gap-responsive-md flex min-h-[28rem] flex-col md:h-[40rem] md:flex-row"
        data-testid="inventory-search-shell"
      >
        <Box className="border-border flex max-h-[28rem] w-full flex-shrink-0 flex-col overflow-hidden rounded-tr-lg border md:h-full md:max-h-none md:w-64">
          <Box className="border-border bg-background-surface flex min-h-0 flex-1 flex-col border-t p-4">
            <Box className="flex-1 overflow-hidden" data-testid="inventory-list">
              <SidebarList
                items={searchResults}
                selectedId={selectedListingId ?? undefined}
                isLoading={false}
                onNavigateToProperty={handleNavigate}
                activeTab="saved"
                imageHeight="tall"
              />
            </Box>
          </Box>
        </Box>

        <Box className="flex min-h-0 flex-1 flex-col">
          <InventoryMapPanel
            results={searchResults}
            currentPage={currentPage}
            onSelectListing={setSelectedListingId}
            onPageChange={setCurrentPage}
          />
        </Box>
      </Box>
    </Box>
  );
}
