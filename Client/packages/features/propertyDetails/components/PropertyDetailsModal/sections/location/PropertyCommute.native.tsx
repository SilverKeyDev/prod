import React from "react";

import { color, spacing } from "packages/design-tokens";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper.native";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Icon } from "packages/ui/components/primitives";
import { Box, Image, Text } from "packages/ui/components/primitives";

import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

type TravelTimeItem = {
  location_name?: string;
  name?: string;
  location_address?: string;
  address?: string;
  travel_time?: string | number;
  commute_tolerance?: number;
};

function CommuteTravelTimeCards({ travelTimes }: { travelTimes: TravelTimeItem[] }) {
  return (
    <Box className="gap-4">
      {travelTimes.map((c, i) => {
        const travelTimeMinutes = c.travel_time
          ? parseInt(String(c.travel_time).replace(/\D/g, ""), 10)
          : null;
        const tolerance = c.commute_tolerance;
        let bgClass = "bg-primary";
        let textClass = "text-primary";
        if (typeof travelTimeMinutes === "number" && typeof tolerance === "number") {
          if (travelTimeMinutes > tolerance * 1.2) {
            bgClass = "bg-primary-muted";
            textClass = "text-destructive";
          } else if (travelTimeMinutes > tolerance) {
            bgClass = "bg-accent-muted";
            textClass = "text-accent";
          }
        }
        return (
          <Box key={i} className="border-border bg-background-surface rounded-lg border p-4">
            <Box className="flex-row items-center justify-between">
              <Box className="min-w-0 flex-1">
                <Box className="flex-row items-center justify-between">
                  <Text
                    className={`text-text-secondary flex-1 text-sm font-medium ${textClass}`}
                    numberOfLines={1}
                  >
                    {c.location_name || c.name || c.location_address || c.address}
                  </Text>
                  <Text
                    className={`ml-2 flex-shrink-0 rounded px-2 py-1 font-medium ${bgClass} ${textClass}`}
                  >
                    {c.travel_time ?? "N/A"}
                  </Text>
                </Box>
                <Box className="mt-1 flex-row items-center justify-between">
                  <Text className="text-text-secondary flex-1 text-xs" numberOfLines={1}>
                    {c.location_address || c.address}
                  </Text>
                  {tolerance != null && (
                    <Text className="text-text-secondary ml-2 flex-shrink-0 text-xs">
                      Target: {tolerance} min
                    </Text>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function CommuteAnalysisContent({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;
  const dataObj = data as Record<string, unknown>;
  const entries = Object.entries(dataObj).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;
  return (
    <Box className="mt-4 gap-2">
      {entries.map(([key, value]) => {
        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <Text className="text-text-secondary mb-1 text-sm font-medium">{displayKey}</Text>
              <Box className="gap-1">
                {value.map((item, i) => (
                  <Text key={i} className="text-text-secondary text-sm">
                    • {String(item)}
                  </Text>
                ))}
              </Box>
            </Box>
          );
        }
        return (
          <Box key={key} className="flex-row justify-between">
            <Text className="text-text-secondary text-sm">{displayKey}:</Text>
            <Text className="text-text-secondary text-sm font-medium">{String(value)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

type PropertyCommuteProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyCommute: React.FC<PropertyCommuteProps> = ({ property, analysisContent }) => {
  const commute = (property as unknown as { commute_data?: unknown }).commute_data as
    | {
        map_url?: string;
        travel_times?: TravelTimeItem[];
        commute_time?: string | number;
        commute_distance?: string | number;
      }
    | undefined;

  if (!commute) return null;
  const hasTravelTimes = Array.isArray(commute.travel_times) && commute.travel_times.length > 0;
  const hasSimple = commute.commute_time != null || commute.commute_distance != null;
  if (!hasTravelTimes && !hasSimple && !analysisContent) return null;

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "commute")
      ?.label ?? "Commute Information";

  return (
    <Box className="p-6">
      <Box className="mb-4 flex-row items-center gap-2">
        <Icon name="map-pin" size={20} color={color("brown.DEFAULT")} />
        <Text className="text-text-secondary text-lg font-semibold">{sectionLabel}</Text>
      </Box>
      <SectionTintWrapper className="mt-2">
        {hasTravelTimes ? (
          <Box className="gap-4">
            {commute.map_url ? (
              <Box className="border-border bg-background-surface rounded-lg border p-4">
                <Image
                  source={{ uri: commute.map_url }}
                  style={{
                    width: "100%",
                    aspectRatio: 1,
                    borderRadius: spacingToNumber(spacing(2)),
                  }}
                  resizeMode="contain"
                />
              </Box>
            ) : (
              <Box className="border-border bg-background-surface items-center justify-center rounded-lg border p-4">
                <Icon name="map-pin" size={48} color="rgba(140, 111, 90, 0.4)" />
                <Text className="text-text-secondary mt-3 font-medium">Commute Map</Text>
                <Text className="text-text-secondary mt-1 text-sm">
                  Map generation in progress...
                </Text>
              </Box>
            )}
            <CommuteTravelTimeCards travelTimes={commute.travel_times ?? []} />
          </Box>
        ) : (
          <Box className="gap-2">
            {commute.commute_time != null && (
              <Text className="text-text-secondary text-sm">
                <Text className="text-text-secondary font-semibold">Commute Time:</Text>{" "}
                {String(commute.commute_time)} minutes
              </Text>
            )}
            {commute.commute_distance != null && (
              <Text className="text-text-secondary text-sm">
                <Text className="text-text-secondary font-semibold">Commute Distance:</Text>{" "}
                {String(commute.commute_distance)} miles
              </Text>
            )}
          </Box>
        )}
        {analysisContent != null && (
          <Box className="border-border bg-background-surface mt-4 rounded-lg border p-4">
            <CommuteAnalysisContent data={analysisContent} />
          </Box>
        )}
      </SectionTintWrapper>
    </Box>
  );
};
