/**
 * Helpers for PropertyCommute; extracted to satisfy max-lines-per-function.
 * File-level disable: exports both a component and a render helper (react-refresh/only-export-components).
 */
/* eslint-disable react-refresh/only-export-components */
import React from "react";

import { useLocalization } from "packages/contexts";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { formatAnalysisLabel } from "packages/utils/propertyDetails";

export function renderCommuteAnalysisContent(data: unknown): React.ReactNode {
  if (!data || typeof data !== "object") return null;
  const dataObj = data as Record<string, unknown>;
  const entries = Object.entries(dataObj).filter(
    ([_, value]) => value !== null && value !== undefined && value !== "",
  );
  if (entries.length === 0) return null;
  return (
    <Box className="mt-4 space-y-2 text-left">
      {entries.map(([key, value]) => {
        const displayKey = formatAnalysisLabel(key);
        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <Title
                as="h4"
                size="sm"
                className="text-text-secondary mb-1 font-medium"
              >
                {displayKey}
              </Title>
              <Box className="text-text-secondary ml-1 flex flex-col gap-1 text-sm">
                {value.map((item, i) => (
                  <BodyText
                    key={i}
                    as="span"
                    className="text-text-secondary text-sm"
                  >
                    • {String(item)}
                  </BodyText>
                ))}
              </Box>
            </Box>
          );
        }
        return (
          <Box key={key} className="flex justify-between text-sm">
            <BodyText as="span" className="text-text-secondary">
              {displayKey}:
            </BodyText>
            <BodyText as="span" className="text-text-secondary font-medium">
              {String(value)}
            </BodyText>
          </Box>
        );
      })}
    </Box>
  );
}

type TravelTimeItem = {
  location_name?: string;
  name?: string;
  location_address?: string;
  address?: string;
  travel_time?: string | number;
  commute_tolerance?: number;
};

export function CommuteTravelTimeCards({
  travelTimes,
}: {
  travelTimes: TravelTimeItem[];
}) {
  const { t } = useLocalization();
  return (
    <>
      {travelTimes.map((c, i) => {
        const travelTimeMinutes = c.travel_time
          ? parseInt(String(c.travel_time).replace(/\D/g, ""), 10)
          : null;
        const tolerance = c.commute_tolerance;
        let colorClass = "text-primary bg-primary";
        if (
          typeof travelTimeMinutes === "number" &&
          typeof tolerance === "number"
        ) {
          if (travelTimeMinutes > tolerance * 1.2) {
            colorClass = "text-destructive bg-primary-muted";
          } else if (travelTimeMinutes > tolerance) {
            colorClass = "text-accent bg-accent-muted";
          }
        }
        return (
          <Card border="light" key={i}>
            <Box className="flex items-center justify-between">
              <Box className="min-w-0 flex-1">
                <Box className="flex items-center justify-between">
                  <BodyText
                    as="span"
                    className="text-text-secondary flex-1 truncate text-sm font-medium"
                  >
                    {c.location_name ||
                      c.name ||
                      c.location_address ||
                      c.address}
                  </BodyText>
                  <BodyText
                    as="span"
                    className={`ml-2 flex-shrink-0 rounded px-2 py-1 font-medium ${colorClass}`}
                  >
                    {c.travel_time || "N/A"}
                  </BodyText>
                </Box>
                <Box className="mt-1 flex items-center justify-between">
                  <BodyText
                    as="p"
                    className="text-text-secondary flex-1 truncate text-xs"
                  >
                    {c.location_address || c.address}
                  </BodyText>
                  {tolerance != null && (
                    <BodyText
                      as="p"
                      className="text-text-secondary ml-2 flex-shrink-0 text-xs"
                    >
                      {t("property_details.target_min", {
                        count: tolerance,
                        defaultValue: "Target: {{count}} min",
                      })}
                    </BodyText>
                  )}
                </Box>
              </Box>
            </Box>
          </Card>
        );
      })}
    </>
  );
}
