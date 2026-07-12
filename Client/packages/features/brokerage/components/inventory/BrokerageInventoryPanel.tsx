import { useMemo } from "react";

import {
  type InventoryStatusFilter,
  useBrokerageInventory,
} from "packages/features/brokerage/hooks/useBrokerageInventory";
import type { InventoryPriceTier } from "packages/features/brokerage/types/inventory";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { inventoryListingsToSearchResults } from "packages/features/brokerage/utils/inventory/inventoryListingToSearchResult";
import {
  PRICE_TIER_LABELS,
  PRICE_TIER_ORDER,
  priceTierLegendEntries,
  statusLegendEntries,
} from "packages/features/brokerage/utils/inventory/inventoryPriceTier";
import { Button, Input, Label } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { getMapPinColorsForScoreAndStatus } from "packages/utils/core/format/mapMatchPinColors";

import { InventoryMapPanel } from "./InventoryMapPanel";

const STATUS_FILTERS: { id: InventoryStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "sold", label: "Sold" },
];

const TIER_FILTERS: { id: InventoryPriceTier | "all"; label: string }[] = [
  { id: "all", label: "All neighborhoods" },
  ...PRICE_TIER_ORDER.map((id) => ({ id, label: PRICE_TIER_LABELS[id] })),
];

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(price / 1000)}K`;
}

function parseOptionalPrice(raw: string): number | null {
  const trimmed = raw.trim().replace(/[$,]/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function filterButtonClass(active: boolean): string {
  return `rounded-lg border px-2.5 py-1 text-sm ${
    active ? "border-border-strong bg-background font-semibold" : "border-border bg-background"
  }`;
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

function LegendDot({ score }: { score: number }) {
  const colors = getMapPinColorsForScoreAndStatus(score);
  return (
    <Box
      className="h-2.5 w-2.5 shrink-0 rounded-full border"
      style={{ backgroundColor: colors.fillColor, borderColor: colors.strokeColor }}
      aria-hidden
    />
  );
}

type Props = {
  timePeriod?: TimePeriod;
};

/**
 * Market analytics map: KPI/filter header + full-bleed pins (no listing cards).
 */
export function BrokerageInventoryPanel({ timePeriod = "all" }: Props) {
  const {
    listings,
    metrics,
    filters,
    statusFilter,
    setStatusFilter,
    setPriceTierFilter,
    setPriceMin,
    setPriceMax,
    setPropertyType,
    setAgentQuery,
    propertyTypeOptions,
    colorMode,
    setColorMode,
    isLoading,
  } = useBrokerageInventory(timePeriod);

  const searchResults = useMemo(
    () => inventoryListingsToSearchResults(listings, colorMode),
    [listings, colorMode]
  );

  const legend =
    colorMode === "price_tier"
      ? priceTierLegendEntries().map((e) => ({
          key: e.id,
          label: `${e.label} (${e.band})`,
          score: e.score,
        }))
      : statusLegendEntries().map((e) => ({
          key: e.id,
          label: e.label,
          score: e.score,
        }));

  return (
    <Box className="flex min-h-0 w-full flex-col gap-4" data-testid="brokerage-inventory-panel">
      <Box
        className="border-border bg-background-surface flex flex-col gap-3 rounded-xl border px-4 py-3"
        data-testid="inventory-kpi-strip"
      >
        <Box className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <InventoryStat label="Total" value={metrics.total_count} />
          <InventoryStat label="Active" value={metrics.active_count} />
          <InventoryStat label="Pending" value={metrics.pending_count} />
          <InventoryStat label="Sold" value={metrics.sold_count} />
          <InventoryStat label="Avg price" value={formatPrice(metrics.average_price)} />
          <InventoryStat label="Median" value={formatPrice(metrics.median_price)} />
          <InventoryStat
            label="Price range"
            value={
              metrics.min_price != null && metrics.max_price != null
                ? `${formatPrice(metrics.min_price)}–${formatPrice(metrics.max_price)}`
                : "—"
            }
          />
        </Box>

        <Box className="flex flex-col gap-2" data-testid="inventory-filters">
          <Box className="flex flex-wrap gap-1.5" data-testid="inventory-filter-status">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                variant="outline"
                size="sm"
                onPress={() => setStatusFilter(f.id)}
                className={filterButtonClass(statusFilter === f.id)}
                data-testid={`inventory-filter-${f.id}`}
              >
                {f.label}
              </Button>
            ))}
          </Box>

          <Box className="flex flex-wrap gap-1.5" data-testid="inventory-filter-neighborhoods">
            {TIER_FILTERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                variant="outline"
                size="sm"
                onPress={() => setPriceTierFilter(f.id)}
                className={filterButtonClass(filters.priceTier === f.id)}
                data-testid={`inventory-filter-tier-${f.id}`}
              >
                {f.label}
              </Button>
            ))}
          </Box>

          <Box className="flex flex-wrap gap-1.5" data-testid="inventory-filter-property-types">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={() => setPropertyType(null)}
              className={filterButtonClass(filters.propertyType == null)}
              data-testid="inventory-filter-type-all"
            >
              All types
            </Button>
            {propertyTypeOptions.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onPress={() => setPropertyType(type)}
                className={filterButtonClass(filters.propertyType === type)}
                data-testid={`inventory-filter-type-${type.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {type}
              </Button>
            ))}
          </Box>

          <Box className="flex flex-wrap items-end gap-2">
            <Box className="flex min-w-28 flex-col gap-0.5">
              <Label htmlFor="inventory-price-min" className="sr-only">
                Min price
              </Label>
              <Input
                id="inventory-price-min"
                size="sm"
                type="text"
                inputMode="numeric"
                placeholder="Min price"
                value={filters.priceMin != null ? String(filters.priceMin) : ""}
                onValueChange={(v) => setPriceMin(parseOptionalPrice(v))}
                data-testid="inventory-filter-price-min"
              />
            </Box>
            <Box className="flex min-w-28 flex-col gap-0.5">
              <Label htmlFor="inventory-price-max" className="sr-only">
                Max price
              </Label>
              <Input
                id="inventory-price-max"
                size="sm"
                type="text"
                inputMode="numeric"
                placeholder="Max price"
                value={filters.priceMax != null ? String(filters.priceMax) : ""}
                onValueChange={(v) => setPriceMax(parseOptionalPrice(v))}
                data-testid="inventory-filter-price-max"
              />
            </Box>

            <Box className="flex min-w-40 flex-col gap-0.5">
              <Label htmlFor="inventory-agent" className="sr-only">
                Agent
              </Label>
              <Input
                id="inventory-agent"
                size="sm"
                type="text"
                placeholder="Agent name"
                value={filters.agentQuery}
                onValueChange={setAgentQuery}
                data-testid="inventory-filter-agent"
              />
            </Box>

            <Box className="flex flex-wrap gap-1.5" data-testid="inventory-color-mode">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onPress={() => setColorMode("price_tier")}
                className={filterButtonClass(colorMode === "price_tier")}
                data-testid="inventory-color-price-tier"
              >
                Color by price
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onPress={() => setColorMode("status")}
                className={filterButtonClass(colorMode === "status")}
                data-testid="inventory-color-status"
              >
                Color by status
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className="flex flex-wrap items-center gap-3" data-testid="inventory-color-legend">
          <BodyText size="xs" muted>
            Legend
          </BodyText>
          {legend.map((item) => (
            <Box key={item.key} className="flex items-center gap-1.5">
              <LegendDot score={item.score} />
              <BodyText size="xs">{item.label}</BodyText>
            </Box>
          ))}
        </Box>

        {isLoading ? (
          <BodyText size="xs" muted>
            Loading inventory…
          </BodyText>
        ) : null}
      </Box>

      <Box className="flex min-h-96 flex-col" data-testid="inventory-map-shell">
        <InventoryMapPanel results={searchResults} colorMode={colorMode} />
      </Box>
    </Box>
  );
}
