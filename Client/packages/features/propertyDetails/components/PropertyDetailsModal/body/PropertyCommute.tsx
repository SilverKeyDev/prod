import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Box, Image } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
export const PropertyCommute: React.FC<PropertyComponentProps> = ({ property }) => {
  const { t } = useLocalization();
  const commute = (
    property as unknown as {
      commute_data?: unknown;
    }
  ).commute_data as
    | {
        map_url?: string;
        travel_times?: Array<{
          location_name?: string;
          name?: string;
          location_address?: string;
          address?: string;
          travel_time?: string | number;
          commute_tolerance?: number;
        }>;
        commute_time?: string | number;
        commute_distance?: string | number;
      }
    | undefined;
  if (!commute) return null;
  const hasTravelTimes = Array.isArray(commute.travel_times) && commute.travel_times.length > 0;
  const hasSimple = commute.commute_time != null || commute.commute_distance != null;
  if (!hasTravelTimes && !hasSimple) return null;
  return (
    <Box className="p-6">
      <Box className="mb-4 flex items-center gap-2">
        <Icon name="map-pin" className="text-text-secondary h-5 w-5" />
        <Title as="h3" size="lg" className="text-text-secondary font-semibold">
          {t("property_details.commute_information")}
        </Title>
      </Box>

      <Box className="border-border bg-accent-muted rounded-lg border p-6">
        {hasTravelTimes ? (
          <Box className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <Box>
              {commute.map_url ? (
                <Box className="border-border bg-background-surface rounded-lg border p-4">
                  <Box className="aspect-square w-full">
                    <Image
                      src={commute.map_url}
                      alt={t("property_details.commute_map")}
                      className="h-full w-full rounded object-contain"
                    />
                  </Box>
                </Box>
              ) : (
                <Box className="border-border bg-background-surface rounded-lg border p-4">
                  <Box className="flex aspect-square w-full items-center justify-center">
                    <Box className="text-text-secondary text-center">
                      <Icon name="map-pin" className="text-text-secondary mx-auto mb-3 h-12 w-12" />
                      <BodyText as="p" className="text-text-secondary font-medium">
                        {t("property_details.commute_map")}
                      </BodyText>
                      <BodyText as="p" size="sm" className="text-text-secondary mt-1">
                        {t("property_details.map_generating")}
                      </BodyText>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            <Box className="flex h-full flex-col justify-center space-y-4">
              {commute.travel_times!.map((c, i) => {
                const travelTimeMinutes = c.travel_time
                  ? parseInt(String(c.travel_time).replace(/\D/g, ""))
                  : null;
                const tolerance = c.commute_tolerance;
                let colorClass = "text-primary bg-primary";
                if (typeof travelTimeMinutes === "number" && typeof tolerance === "number") {
                  if (travelTimeMinutes > tolerance * 1.2) {
                    colorClass = "text-red-600 bg-red-50";
                  } else if (travelTimeMinutes > tolerance) {
                    colorClass = "text-amber-600 bg-amber-50";
                  }
                }
                return (
                  <Card key={i}>
                    <Box className="flex items-center justify-between">
                      <Box className="min-w-0 flex-1">
                        <Box className="flex items-center justify-between">
                          <BodyText
                            as="span"
                            className="text-text-secondary flex-1 truncate text-sm font-medium"
                          >
                            {c.location_name || c.name}
                          </BodyText>
                          <BodyText
                            as="span"
                            className={`ml-2 flex-shrink-0 rounded px-2 py-1 font-medium ${colorClass}`}
                          >
                            {c.travel_time || t("house.na")}
                          </BodyText>
                        </Box>
                        <Box className="mt-1 flex items-center justify-between">
                          <BodyText as="p" className="text-text-secondary flex-1 truncate text-xs">
                            {c.location_address || c.address}
                          </BodyText>
                          {tolerance && (
                            <BodyText
                              as="p"
                              className="text-text-secondary ml-2 flex-shrink-0 text-xs"
                            >
                              {t("property_details.target_min", {
                                count: tolerance,
                              })}
                            </BodyText>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          </Box>
        ) : (
          <Box className="text-text-secondary text-sm">
            {commute.commute_time != null && (
              <BodyText as="p">
                <strong className="text-text-secondary">
                  {t("property_details.commute_time")}
                </strong>
                {t("common.space")}
                {String(commute.commute_time)} {t("property_details.minutes")}
              </BodyText>
            )}
            {commute.commute_distance != null && (
              <BodyText as="p">
                <strong className="text-text-secondary">
                  {t("property_details.commute_distance")}
                </strong>
                {t("common.space")}
                {String(commute.commute_distance)} {t("property_details.miles")}
              </BodyText>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
