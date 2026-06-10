import React from "react";

import { View } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { Box, Text } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import { styles } from "./propertyCommuteMapLegend.native.styles";

type TravelRow = {
  location_name?: string;
  name?: string;
  label?: string;
  location_address?: string;
  address?: string;
  travel_time?: string | number;
};

type PropertyCommuteMapLegendNativeProps = {
  commuteSearchOverlay: unknown | null;
  travelTimes: TravelRow[] | undefined;
};

export function PropertyCommuteMapLegendNative({
  commuteSearchOverlay,
  travelTimes,
}: PropertyCommuteMapLegendNativeProps): React.ReactElement {
  const { t } = useLocalization();

  return (
    <Box className="gap-2">
      <Box className="flex-row flex-wrap gap-x-4 gap-y-2">
        <Box className="flex-row items-center gap-2">
          <View style={[styles.legendDot, { backgroundColor: color("olive.DEFAULT") }]} />
          <BodyText as="span" size="xs" className="text-text-secondary">
            {t("property_details.commute_legend_listing")}
          </BodyText>
        </Box>
        <Box className="flex-row items-center gap-2">
          <View style={[styles.legendDot, { backgroundColor: color("brown.DEFAULT") }]} />
          <BodyText as="span" size="xs" className="text-text-secondary">
            {t("property_details.commute_legend_important_locations")}
          </BodyText>
        </Box>
        {commuteSearchOverlay ? (
          <Box className="flex-row items-center gap-2">
            <View
              style={[
                styles.legendSquare,
                {
                  backgroundColor: color("olive.DEFAULT"),
                  opacity: 0.35,
                },
              ]}
            />
            <BodyText as="span" size="xs" className="text-text-secondary">
              {t("property_details.commute_legend_search_area")}
            </BodyText>
          </Box>
        ) : null}
      </Box>
      {Array.isArray(travelTimes) && travelTimes.length > 0 ? (
        <Box className="gap-1">
          {travelTimes.map((row, idx) => {
            const destLabel = String(
              row.location_name ?? row.label ?? row.name ?? row.address ?? `Stop ${idx + 1}`
            );
            const timeStr =
              row.travel_time != null && String(row.travel_time).trim()
                ? String(row.travel_time)
                : t("property_details.commute_travel_time_unknown");
            return (
              <BodyText
                key={`${destLabel}:${idx}`}
                as="p"
                size="xs"
                className="text-text-secondary"
              >
                <Text className="text-text-secondary font-semibold">
                  {t("property_details.commute_route_to", {
                    label: destLabel,
                    defaultValue: "Drive to {{label}}",
                  })}
                </Text>{" "}
                · {timeStr}
              </BodyText>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}
