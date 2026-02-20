import React from "react";

import { MapPin } from "lucide-react";

import { useLocalization } from "packages/contexts";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui/index.web";
import { Image } from "@/components/ui/index.web";

import type { PropertyComponentProps } from "./types";

export const PropertyCommute: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { t } = useLocalization();
  const commute = (property as unknown as { commute_data?: unknown })
    .commute_data as
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

  const hasTravelTimes =
    Array.isArray(commute.travel_times) && commute.travel_times.length > 0;
  const hasSimple =
    commute.commute_time != null || commute.commute_distance != null;
  if (!hasTravelTimes && !hasSimple) return null;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-gray-600" />
        <Title as="h3" size="lg" className="font-semibold text-brown">
          {t("property_details.commute_information")}
        </Title>
      </div>

      <div className="rounded-lg border border-beige bg-beige/20 p-6">
        {hasTravelTimes ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div>
              {commute.map_url ? (
                <div className="rounded-lg border border-beige/40 bg-white p-4">
                  <div className="aspect-square w-full">
                    <Image
                      src={commute.map_url}
                      alt={t("property_details.commute_map")}
                      className="h-full w-full rounded object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-beige/40 bg-white p-4">
                  <div className="aspect-square flex w-full items-center justify-center">
                    <div className="text-center text-brown/60">
                      <MapPin className="mx-auto mb-3 h-12 w-12 text-brown/40" />
                      <BodyText as="p" className="font-medium text-brown">
                        {t("property_details.commute_map")}
                      </BodyText>
                      <BodyText as="p" size="sm" className="mt-1 text-brown/60">
                        {t("property_details.map_generating")}
                      </BodyText>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex h-full flex-col justify-center space-y-4">
              {commute.travel_times!.map((c, i) => {
                const travelTimeMinutes = c.travel_time
                  ? parseInt(String(c.travel_time).replace(/\D/g, ""))
                  : null;
                const tolerance = c.commute_tolerance;

                let colorClass = "text-olive bg-olive/10";
                if (
                  typeof travelTimeMinutes === "number" &&
                  typeof tolerance === "number"
                ) {
                  if (travelTimeMinutes > tolerance * 1.2) {
                    colorClass = "text-red-600 bg-red-50";
                  } else if (travelTimeMinutes > tolerance) {
                    colorClass = "text-amber-600 bg-amber-50";
                  }
                }

                return (
                  <Card key={i}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <BodyText
                            as="span"
                            className="flex-1 truncate text-sm font-medium text-brown"
                          >
                            {c.location_name || c.name}
                          </BodyText>
                          <BodyText
                            as="span"
                            className={`ml-2 flex-shrink-0 rounded px-2 py-1 font-medium ${colorClass}`}
                          >
                            {c.travel_time || t("cards.na")}
                          </BodyText>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <BodyText
                            as="p"
                            className="flex-1 truncate text-xs text-brown/60"
                          >
                            {c.location_address || c.address}
                          </BodyText>
                          {tolerance && (
                            <BodyText
                              as="p"
                              className="ml-2 flex-shrink-0 text-xs text-brown/60"
                            >
                              {t("property_details.target_min", {
                                count: tolerance,
                              })}
                            </BodyText>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-brown/70">
            {commute.commute_time != null && (
              <BodyText as="p">
                <strong className="text-brown">
                  {t("property_details.commute_time")}
                </strong>
                {t("common.space")}
                {String(commute.commute_time)} {t("property_details.minutes")}
              </BodyText>
            )}
            {commute.commute_distance != null && (
              <BodyText as="p">
                <strong className="text-brown">
                  {t("property_details.commute_distance")}
                </strong>
                {t("common.space")}
                {String(commute.commute_distance)} {t("property_details.miles")}
              </BodyText>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
