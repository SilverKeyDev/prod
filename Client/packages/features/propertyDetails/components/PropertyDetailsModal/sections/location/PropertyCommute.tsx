import React from "react";

import { Icon } from "@ui/icons";

import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Image } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";

import { CommuteTravelTimeCards } from "./propertyCommuteHelpers";
import { CommuteAnalysisContent } from "./propertyCommuteRender";
type PropertyCommuteProps = PropertyComponentProps & {
  analysisContent?: unknown;
};
export const PropertyCommute: React.FC<PropertyCommuteProps> = ({ property, analysisContent }) => {
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
  if (!hasTravelTimes && !hasSimple && !analysisContent) return null;
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "commute")
      ?.label || "Commute Information";
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="map-pin" className="text-brown h-5 w-5" />
        <Title as="h3" size="lg" className="text-brown font-semibold">
          {sectionLabel}
        </Title>
      </div>
      <SectionTintWrapper className="mt-2">
        {hasTravelTimes ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div>
              {commute.map_url ? (
                <div className="border-beige/40 rounded-lg border bg-white p-4">
                  <div className="aspect-square w-full">
                    <Image
                      src={commute.map_url}
                      alt="Commute Map"
                      className="h-full w-full rounded object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="border-beige/40 rounded-lg border bg-white p-4">
                  <div className="flex aspect-square w-full items-center justify-center">
                    <div className="text-brown/60 text-center">
                      <Icon name="map-pin" className="text-brown/40 mx-auto mb-3 h-12 w-12" />
                      <BodyText as="p" className="text-brown font-medium">
                        Commute Map
                      </BodyText>
                      <BodyText as="p" size="sm" className="text-brown/60 mt-1">
                        Map generation in progress...
                      </BodyText>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex h-full flex-col justify-center space-y-4">
              <CommuteTravelTimeCards travelTimes={commute.travel_times ?? []} />
            </div>
          </div>
        ) : (
          <div className="text-brown/70 text-sm">
            {commute.commute_time != null && (
              <BodyText as="p">
                <strong className="text-brown">Commute Time:</strong> {String(commute.commute_time)}{" "}
                minutes
              </BodyText>
            )}
            {commute.commute_distance != null && (
              <BodyText as="p">
                <strong className="text-brown">Commute Distance:</strong>{" "}
                {String(commute.commute_distance)} miles
              </BodyText>
            )}
          </div>
        )}
        {analysisContent != null && (
          <Card className="mt-4">
            <CommuteAnalysisContent data={analysisContent} />
          </Card>
        )}
      </SectionTintWrapper>
    </div>
  );
};
