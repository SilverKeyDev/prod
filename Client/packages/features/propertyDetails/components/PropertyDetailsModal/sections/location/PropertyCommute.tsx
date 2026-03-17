import React from "react";

import { Icon } from "@ui/icons";

import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives/media";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

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
    <Box className="p-6">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon name="map-pin" className="text-foreground h-5 w-5" />
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          {sectionLabel}
        </Title>
      </Box>
      <SectionTintWrapper className="mt-2">
        {hasTravelTimes ? (
          <Box className="grid-responsive-1-md-2 gap-4 sm:gap-6">
            <Box>
              {commute.map_url ? (
                <Box className="border-border-card-subtle bg-background-surface rounded-lg border p-4">
                  <Box className="aspect-square w-full">
                    <Image
                      src={commute.map_url}
                      alt="Commute Map"
                      className="h-full w-full rounded object-contain"
                    />
                  </Box>
                </Box>
              ) : (
                <Box className="border-border-card-subtle bg-background-surface rounded-lg border p-4">
                  <Box className="flex aspect-square w-full flex-row items-center justify-center">
                    <Box className="text-text-secondary text-center">
                      <Icon
                        name="map-pin"
                        className="text-text-secondary mb-3 h-12 w-12 self-center"
                      />
                      <BodyText as="p" className="text-foreground text-center font-medium">
                        Commute Map
                      </BodyText>
                      <BodyText as="p" size="sm" className="text-text-secondary mt-1 text-center">
                        Map generation in progress...
                      </BodyText>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
            <Box className="flex h-full flex-row flex-col justify-center gap-4">
              <CommuteTravelTimeCards travelTimes={commute.travel_times ?? []} />
            </Box>
          </Box>
        ) : (
          <Box className="text-text-secondary text-sm">
            {commute.commute_time != null && (
              <BodyText as="p">
                <strong className="text-foreground">Commute Time:</strong>{" "}
                {String(commute.commute_time)} minutes
              </BodyText>
            )}
            {commute.commute_distance != null && (
              <BodyText as="p">
                <strong className="text-foreground">Commute Distance:</strong>{" "}
                {String(commute.commute_distance)} miles
              </BodyText>
            )}
          </Box>
        )}
        {analysisContent != null && (
          <Card border="light" className="mt-4">
            <CommuteAnalysisContent data={analysisContent} />
          </Card>
        )}
      </SectionTintWrapper>
    </Box>
  );
};
