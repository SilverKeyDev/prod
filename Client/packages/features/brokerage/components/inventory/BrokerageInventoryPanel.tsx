import { useMemo } from "react";

import { Icon } from "@ui/icons";

import {
  type InventoryStatusFilter,
  useBrokerageInventory,
} from "packages/features/brokerage/hooks/useBrokerageInventory";
import type { InventoryListingStatus } from "packages/features/brokerage/types/inventory";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { inventoryListingsToSearchResults } from "packages/features/brokerage/utils/inventory/inventoryListingToSearchResult";
import { inventoryStatusToPinScore } from "packages/features/brokerage/utils/inventory/inventoryStatusPinScore";
import { BudgetRangeSlider, Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import type { IconName } from "packages/ui/types/icons";
import { formatCompactNumber, getMapPinColorsForScoreAndStatus } from "packages/utils";

import { InventoryMapPanel } from "./InventoryMapPanel";

const PRICE_TICK_VALUES = [
  0, 100_000, 250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000,
  10_000_000,
];
const PRICE_SLIDER_DEFAULT_MIN = 0;
const PRICE_SLIDER_DEFAULT_MAX = 2_000_000;

const STATUS_FILTERS: {
  id: InventoryStatusFilter;
  label: string;
  iconName: IconName;
}[] = [
  { id: "all", label: "All", iconName: "grid-3x3" },
  { id: "active", label: "Active", iconName: "activity" },
  { id: "pending", label: "Pending", iconName: "clock" },
  { id: "sold", label: "Sold", iconName: "check-circle" },
];

const PROPERTY_TYPE_ICONS: Record<string, IconName> = {
  "Single Family": "home",
  Condo: "building",
  Townhome: "building-2",
  "Multi Family": "folders",
  Land: "map",
};

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(price / 1000)}K`;
}

function filterChipClass(active: boolean): string {
  return active ? "rounded-full" : "rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200";
}

function InventoryStat({
  label,
  value,
  iconName,
}: {
  label: string;
  value: string | number;
  iconName?: IconName;
}) {
  return (
    <Box className="flex flex-col gap-0.5">
      <Box className="flex items-center gap-1">
        {iconName ? (
          <Icon name={iconName} className="text-text-secondary h-3.5 w-3.5 shrink-0" />
        ) : null}
        <BodyText size="xs" muted>
          {label}
        </BodyText>
      </Box>
      <Title size="sm" as="span">
        {value}
      </Title>
    </Box>
  );
}

function StatusFilterButton({
  id,
  label,
  iconName,
  active,
  onPress,
}: {
  id: InventoryStatusFilter;
  label: string;
  iconName: IconName;
  active: boolean;
  onPress: () => void;
}) {
  const tint =
    id === "all"
      ? null
      : getMapPinColorsForScoreAndStatus(inventoryStatusToPinScore(id as InventoryListingStatus));

  const iconColor = tint ? (active ? "#ffffff" : tint.fillColor) : undefined;

  return (
    <Box
      data-testid={`inventory-filter-${id}`}
      className="inline-flex"
      style={
        tint && active
          ? { backgroundColor: tint.fillColor, borderColor: tint.strokeColor }
          : undefined
      }
    >
      <Button
        type="button"
        size="sm"
        variant={active && !tint ? "primary" : "ghost"}
        icon={
          <Icon
            name={iconName}
            className="h-4 w-4"
            style={iconColor ? { color: iconColor } : undefined}
          />
        }
        onPress={onPress}
        className={
          tint && active
            ? "rounded-full bg-transparent text-white hover:opacity-90"
            : filterChipClass(active)
        }
        style={tint && !active ? { color: tint.fillColor } : undefined}
      >
        {label}
      </Button>
    </Box>
  );
}

function FilterChip({
  active,
  iconName,
  label,
  onPress,
  testId,
}: {
  active: boolean;
  iconName: IconName;
  label: string;
  onPress: () => void;
  testId: string;
}) {
  return (
    <Box data-testid={testId} className="inline-flex">
      <Button
        type="button"
        size="sm"
        variant={active ? "primary" : "ghost"}
        iconName={iconName}
        onPress={onPress}
        className={filterChipClass(active)}
      >
        {label}
      </Button>
    </Box>
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
    setPriceMin,
    setPriceMax,
    setPropertyType,
    propertyTypeOptions,
    colorMode,
    setColorMode,
    isLoading,
  } = useBrokerageInventory(timePeriod);

  const searchResults = useMemo(
    () => inventoryListingsToSearchResults(listings, colorMode),
    [listings, colorMode]
  );

  const sliderMin = filters.priceMin ?? PRICE_SLIDER_DEFAULT_MIN;
  const sliderMax = filters.priceMax ?? PRICE_SLIDER_DEFAULT_MAX;

  const handlePriceRangeChange = (minValue: number, maxValue: number) => {
    const roundedMin = Math.round(minValue / 1000) * 1000;
    const roundedMax = Math.round(maxValue / 1000) * 1000;
    setPriceMin(roundedMin <= PRICE_SLIDER_DEFAULT_MIN ? null : roundedMin);
    setPriceMax(roundedMax >= PRICE_SLIDER_DEFAULT_MAX ? null : roundedMax);
  };

  return (
    <Box className="flex min-h-0 w-full flex-col gap-4" data-testid="brokerage-inventory-panel">
      <Box
        className="border-border bg-background-surface flex flex-col gap-3 rounded-xl border px-4 py-3"
        data-testid="inventory-kpi-strip"
      >
        <Box className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <InventoryStat label="Total" value={metrics.total_count} iconName="home" />
          <InventoryStat label="Active" value={metrics.active_count} iconName="activity" />
          <InventoryStat label="Pending" value={metrics.pending_count} iconName="clock" />
          <InventoryStat label="Sold" value={metrics.sold_count} iconName="check-circle" />
          <InventoryStat
            label="Avg price"
            value={formatPrice(metrics.average_price)}
            iconName="dollar-sign"
          />
          <InventoryStat
            label="Median"
            value={formatPrice(metrics.median_price)}
            iconName="bar-chart-2"
          />
          <InventoryStat
            label="Price range"
            value={
              metrics.min_price != null && metrics.max_price != null
                ? `${formatPrice(metrics.min_price)}–${formatPrice(metrics.max_price)}`
                : "—"
            }
            iconName="sliders-horizontal"
          />
        </Box>

        <Box className="flex flex-col gap-3" data-testid="inventory-filters">
          <Box className="flex flex-wrap items-stretch gap-2">
            <Box
              className="bg-background-muted flex flex-wrap gap-1 rounded-lg p-1"
              data-testid="inventory-filter-status"
            >
              {STATUS_FILTERS.map((f) => (
                <StatusFilterButton
                  key={f.id}
                  id={f.id}
                  label={f.label}
                  iconName={f.iconName}
                  active={statusFilter === f.id}
                  onPress={() => setStatusFilter(f.id)}
                />
              ))}
            </Box>

            <Box
              className="bg-background-muted flex flex-wrap gap-1 rounded-lg p-1"
              data-testid="inventory-filter-property-types"
            >
              <FilterChip
                active={filters.propertyType == null}
                iconName="grid-3x3"
                label="All types"
                onPress={() => setPropertyType(null)}
                testId="inventory-filter-type-all"
              />
              {propertyTypeOptions.map((type) => (
                <FilterChip
                  key={type}
                  active={filters.propertyType === type}
                  iconName={PROPERTY_TYPE_ICONS[type] ?? "home"}
                  label={type}
                  onPress={() => setPropertyType(type)}
                  testId={`inventory-filter-type-${type.replace(/\s+/g, "-").toLowerCase()}`}
                />
              ))}
            </Box>

            <Box
              className="bg-background-muted flex flex-wrap gap-1 rounded-lg p-1"
              data-testid="inventory-color-mode"
            >
              <FilterChip
                active={colorMode === "status"}
                iconName="flag"
                label="By status"
                onPress={() => setColorMode("status")}
                testId="inventory-color-status"
              />
              <FilterChip
                active={colorMode === "price_tier"}
                iconName="dollar-sign"
                label="By price"
                onPress={() => setColorMode("price_tier")}
                testId="inventory-color-price-tier"
              />
            </Box>
          </Box>
        </Box>

        <Box data-testid="inventory-filter-price-range">
          <BodyText size="sm" className="text-text-secondary mb-2 font-medium">
            Price range
          </BodyText>
          <BudgetRangeSlider
            variant="gold"
            tickValues={PRICE_TICK_VALUES}
            minValue={sliderMin}
            maxValue={sliderMax}
            onChange={handlePriceRangeChange}
            formatPrefix="$"
            formatValue={(v) => `$${formatCompactNumber(v)}`}
            minGap={25_000}
            showTextHeader
          />
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
