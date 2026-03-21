import React from "react";

import { Icon } from "@ui/icons";

import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { Box } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { MAX_VISIBLE, truncateAddress } from "./constants";
import type { SearchImportantLocation } from "./types";

function commuteLabel(minutes: number): string {
  return (SEARCH_TRANSLATIONS["search.commute_min"] ?? "{{min}} min").replace(
    "{{min}}",
    String(minutes)
  );
}

function moreLabel(count: number): string {
  return (SEARCH_TRANSLATIONS["search.locations_more"] ?? "+{{count}} more").replace(
    "{{count}}",
    String(count)
  );
}

export type SearchHeaderLocationsTriggerProps = {
  locationsList: SearchImportantLocation[];
  hasLocations: boolean;
  onPress: () => void;
  compact?: boolean;
  /** For accessibility (e.g. aria-expanded). Not used on native. */
  expanded?: boolean;
  /** Panel id for aria-controls (web) */
  panelId?: string;
};

export function SearchHeaderLocationsTrigger({
  locationsList,
  hasLocations,
  onPress,
  compact = false,
  expanded = false,
  panelId,
}: SearchHeaderLocationsTriggerProps): React.ReactElement {
  const wrapperClass = `max-w-[60%] rounded-lg border-2 border-dotted border-gray-400 bg-gray-100 overflow-hidden ${compact ? "shrink-0" : "min-w-0 flex-1"}`;
  const pressableClass = `flex flex-row items-center justify-between gap-2 px-4 w-full ${HEADER_ROW_HEIGHT}`;

  return (
    <Box className={wrapperClass}>
      <Box className="px-1.5">
        <Pressable
          onPress={onPress}
          className={pressableClass}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityHint="Opens location preferences"
          aria-expanded={expanded}
          aria-haspopup="dialog"
          aria-controls={panelId}
        >
          {hasLocations ? (
            <>
              <Box className="flex min-w-0 flex-1 flex-row flex-nowrap items-center justify-start gap-2 overflow-hidden">
                <Icon name="map-pin" className="text-text-secondary h-4 w-4 shrink-0" />
                <Box className="min-w-0 flex-1 flex-row flex-nowrap items-center justify-start gap-x-2 overflow-hidden">
                  {locationsList.slice(0, MAX_VISIBLE).map((loc, i) => (
                    <Box
                      key={`${loc.address}-${loc.commute_tolerance ?? ""}-${i}`}
                      className="flex min-w-0 flex-1 flex-row items-center justify-start gap-1"
                    >
                      <Text
                        className="text-text-primary min-w-0 flex-1 truncate text-left text-sm font-medium"
                        numberOfLines={1}
                      >
                        {truncateAddress(loc.address ?? "")}
                      </Text>
                      {loc.commute_tolerance != null ? (
                        <Text className="text-text-secondary shrink-0 text-sm" numberOfLines={1}>
                          {commuteLabel(loc.commute_tolerance)}
                        </Text>
                      ) : null}
                    </Box>
                  ))}
                  {locationsList.length > MAX_VISIBLE ? (
                    <Text className="text-text-secondary shrink-0 text-sm">
                      {moreLabel(locationsList.length - MAX_VISIBLE)}
                    </Text>
                  ) : null}
                </Box>
              </Box>
              <Icon name="pencil" className="text-text-secondary h-4 w-4 shrink-0" />
            </>
          ) : (
            <Box className="flex flex-1 flex-row items-center justify-start gap-2">
              <Icon name="map-pin" className="text-text-secondary h-4 w-4 shrink-0" />
              <Text className="text-text-primary text-left text-sm font-medium">
                {SEARCH_TRANSLATIONS["search.add_important_locations"] ??
                  SEARCH_TRANSLATIONS["search.add_location"] ??
                  "Add important locations"}
              </Text>
            </Box>
          )}
        </Pressable>
      </Box>
    </Box>
  );
}
