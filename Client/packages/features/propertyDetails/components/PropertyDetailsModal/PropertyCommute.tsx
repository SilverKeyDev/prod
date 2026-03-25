import React from "react";

import { MapPin } from "lucide-react";

import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import AppImage from "@/components/ui/asset/AppImage";

import type { PropertyComponentProps } from "./types";

export const PropertyCommute: React.FC<PropertyComponentProps> = ({ property }) => {
  const commute = (property as unknown as { commute_data?: unknown }).commute_data as
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
      <Box className="mb-4 flex flex-row items-center gap-2">
        <MapPin className="h-5 w-5 text-gray-600" />
        <Title as="h3" size="sm" className="text-brown text-lg font-semibold">
          Commute Information
        </Title>
      </Box>

      <Box className="border-beige bg-beige/20 rounded-lg border p-6">
        {hasTravelTimes ? (
          <Box className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <Box>
              {commute.map_url ? (
                <Box className="border-beige/40 rounded-lg border bg-white p-4">
                  <Box className="aspect-square w-full">
                    <AppImage
                      uri={commute.map_url}
                      alt="Commute Map"
                      className="h-full w-full rounded object-contain"
                    />
                  </Box>
                </Box>
              ) : (
                <Box className="border-beige/40 rounded-lg border bg-white p-4">
                  <Box className="flex aspect-square w-full flex-row items-center justify-center">
                    <Box className="text-brown/60 text-center">
                      <MapPin className="text-brown/40 mx-auto mb-3 h-12 w-12" />
                      <BodyText as="p" size="sm" className="text-brown font-medium">
                        Commute Map
                      </BodyText>
                      <BodyText as="p" size="sm" className="text-brown/60 mt-1">
                        Map generation in progress...
                      </BodyText>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            <Box className="flex h-full flex-col justify-center gap-4">
              {commute.travel_times!.map((c, i) => {
                const travelTimeMinutes = c.travel_time
                  ? parseInt(String(c.travel_time).replace(/\D/g, ""))
                  : null;
                const tolerance = c.commute_tolerance;

                let colorClass = "text-olive bg-olive/10";
                if (typeof travelTimeMinutes === "number" && typeof tolerance === "number") {
                  if (travelTimeMinutes > tolerance * 1.2) {
                    colorClass = "text-red-600 bg-red-50";
                  } else if (travelTimeMinutes > tolerance) {
                    colorClass = "text-amber-600 bg-amber-50";
                  }
                }

                return (
                  <Card key={i}>
                    <Box className="flex flex-row items-center justify-between">
                      <Box className="min-w-0 flex-1">
                        <Box className="flex flex-row items-center justify-between">
                          <BodyText
                            as="span"
                            size="sm"
                            className="text-brown flex-1 truncate font-medium"
                          >
                            {c.location_name || c.name}
                          </BodyText>
                          <BodyText
                            as="span"
                            size="sm"
                            className={`ml-2 flex-shrink-0 rounded px-2 py-1 font-medium ${colorClass}`}
                          >
                            {c.travel_time || "N/A"}
                          </BodyText>
                        </Box>
                        <Box className="mt-1 flex flex-row items-center justify-between">
                          <BodyText as="p" size="xs" className="text-brown/60 flex-1 truncate">
                            {c.location_address || c.address}
                          </BodyText>
                          {tolerance && (
                            <BodyText as="p" size="xs" className="text-brown/60 ml-2 flex-shrink-0">
                              Target: {tolerance} min
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
          <Box className="text-brown/70 text-sm">
            {commute.commute_time != null && (
              <BodyText as="p" size="sm">
                <BodyText as="span" size="sm" className="text-brown font-semibold">
                  Commute Time:
                </BodyText>{" "}
                {String(commute.commute_time)} minutes
              </BodyText>
            )}
            {commute.commute_distance != null && (
              <BodyText as="p" size="sm">
                <BodyText as="span" size="sm" className="text-brown font-semibold">
                  Commute Distance:
                </BodyText>{" "}
                {String(commute.commute_distance)} miles
              </BodyText>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
