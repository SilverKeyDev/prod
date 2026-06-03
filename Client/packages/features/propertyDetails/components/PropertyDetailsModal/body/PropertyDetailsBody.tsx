import React, { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { PropertyAnalysis } from "packages/features/propertyDetails/components/PropertyDetailsModal/body/analysis/PropertyAnalysis";
import { ListingAgentCard } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/agent/ListingAgentCard";
import { ListingAgentCardSkeleton } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/agent/ListingAgentCardSkeleton";
import { MlsListingComplianceFooter } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/compliance/MlsListingComplianceFooter";
import { PropertyDescription } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/description/PropertyDescription";
import { PropertyFeatures } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/features/PropertyFeatures";
import {
  getAgentFromProperty,
  getMlsListingId,
} from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";
import {
  PropertyListingHeader,
  PropertyListingQuickStats,
} from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/summary/PropertyInfo";
import { PropertyCommute } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/commute/PropertyCommute";
import { PropertyDemographics } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/demographics/PropertyDemographics";
import { PropertyLocationMapSection } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/map/PropertyLocationMapSection";
import { PropertyNeighborhood } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/neighborhood/PropertyNeighborhood";
import { PropertySchools } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/schools/PropertySchools";
import { PropertyEnvironmentalFactors } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/other/PropertyEnvironmentalFactors";
import { ProsAndCons } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/other/ProsAndCons";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import type { PropertyDetailsSectionRefs } from "packages/features/propertyDetails/hooks/usePropertyDetailsSectionScroll.web";
import type { PropertyWithAnalysis } from "packages/types/domain/property-analysis";
import Card from "packages/ui/components/cards/Card";
import { Box, Text } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import {
  getClimateEnvironmentalSection,
  getNeighborhoodAnalysisPayload,
  getPropertyDetailsExcludeSections,
  hasEnvironmentalFactorsContent,
  shouldHideStandaloneLocationMap,
  shouldShowListingAgentSkeleton,
} from "packages/utils/propertyDetails";

export type PropertyDetailsBodyProps = PropertyComponentProps & {
  isLoading?: boolean;
  /** Section refs for scroll navigation */
  sectionRefs?: PropertyDetailsSectionRefs;
};

export const PropertyDetailsBody: React.FC<PropertyDetailsBodyProps> = ({
  property,
  isLoading = false,
  sectionRefs,
  commuteSearchOverlay = null,
}) => {
  const { t } = useLocalization();
  const propertyAnalysis = useMemo(
    () => (property as PropertyWithAnalysis).property_analysis,
    [property]
  );

  const hasCommute = useMemo(() => {
    return !!(property as unknown as { commute_data?: unknown }).commute_data;
  }, [property]);

  // Note: Schools display removed from family-friendly section

  const hasAnalysis = useMemo(() => !!propertyAnalysis, [propertyAnalysis]);
  const commuteAnalysis = useMemo(
    () => (propertyAnalysis ? (propertyAnalysis as Record<string, unknown>).commute : undefined),
    [propertyAnalysis]
  );
  const familyFriendlyAnalysis = useMemo(
    () =>
      propertyAnalysis ? (propertyAnalysis as Record<string, unknown>).family_friendly : undefined,
    [propertyAnalysis]
  );
  const neighborhoodAnalysis = useMemo(
    () => getNeighborhoodAnalysisPayload(propertyAnalysis as Record<string, unknown> | undefined),
    [propertyAnalysis]
  );
  const hasNeighborhood = useMemo(
    () =>
      getNeighborhoodAnalysisPayload(propertyAnalysis as Record<string, unknown> | undefined) !=
      null,
    [propertyAnalysis]
  );

  const climateEnvironmentalRaw = useMemo(
    () =>
      getClimateEnvironmentalSection(
        propertyAnalysis as Record<string, unknown> | null | undefined
      ),
    [propertyAnalysis]
  );
  const hasEnvironmentalSection = useMemo(
    () => hasEnvironmentalFactorsContent(climateEnvironmentalRaw),
    [climateEnvironmentalRaw]
  );

  const commuteSectionHasTravelTimesMap = useMemo(
    () => shouldHideStandaloneLocationMap(property),
    [property]
  );

  const excludeSections = useMemo(
    () =>
      getPropertyDetailsExcludeSections({
        property,
        propertyAnalysis: propertyAnalysis as Record<string, unknown> | undefined,
        hasCommute,
        commuteAnalysis,
        familyFriendlyAnalysis,
      }),
    [property, propertyAnalysis, hasCommute, commuteAnalysis, familyFriendlyAnalysis]
  );

  const agent = useMemo(() => getAgentFromProperty(property), [property]);
  const mlsListingId = useMemo(() => getMlsListingId(property), [property]);
  const showListingAgentSkeleton = shouldShowListingAgentSkeleton(isLoading, agent);

  return (
    <Box className="pb-4">
      {/* Two-column layout: main content on left, agent sidebar on right */}
      <Box className="flex flex-col lg:flex-row lg:gap-6">
        {/* Main content area */}
        <Box className="min-w-0 flex-1">
          {/* Overview Section */}
          <Box
            ref={sectionRefs?.overview as React.RefObject<HTMLDivElement> | undefined}
            data-section-id="overview"
          >
            <PropertyListingHeader property={property} isLoading={isLoading} />
            <PropertyListingQuickStats property={property} />
            <PropertyFeatures
              key="propertyFeatures"
              property={property}
              hideListingAgentOnMdUp
              includeListingAgent={false}
              isLoading={isLoading}
            />
            <PropertyDescription property={property} />
          </Box>

          {/* Location Section */}
          <Box
            ref={sectionRefs?.location as React.RefObject<HTMLDivElement> | undefined}
            data-section-id="location"
          >
            {!commuteSectionHasTravelTimesMap ? (
              <PropertyLocationMapSection property={property} isLoading={isLoading} />
            ) : null}
            {commuteSectionHasTravelTimesMap && (hasCommute || commuteAnalysis) ? (
              <PropertyCommute
                property={property}
                analysisContent={commuteAnalysis}
                commuteSearchOverlay={commuteSearchOverlay}
              />
            ) : null}
            {(hasNeighborhood || neighborhoodAnalysis) && (
              <PropertyNeighborhood property={property} analysisContent={neighborhoodAnalysis} />
            )}
            {neighborhoodAnalysis && (
              <PropertyDemographics property={property} analysisContent={neighborhoodAnalysis} />
            )}
            {!commuteSectionHasTravelTimesMap && (hasCommute || commuteAnalysis) ? (
              <PropertyCommute
                property={property}
                analysisContent={commuteAnalysis}
                commuteSearchOverlay={commuteSearchOverlay}
              />
            ) : null}
            {familyFriendlyAnalysis && (
              <PropertySchools property={property} analysisContent={familyFriendlyAnalysis} />
            )}
          </Box>

          {/* Match Section */}
          <Box
            ref={sectionRefs?.match as React.RefObject<HTMLDivElement> | undefined}
            data-section-id="match"
          >
            <ProsAndCons property={property} />
          </Box>

          {/* Analysis Section */}
          <Box
            ref={sectionRefs?.analysis as React.RefObject<HTMLDivElement> | undefined}
            data-section-id="analysis"
          >
            {hasEnvironmentalSection ? (
              <PropertyEnvironmentalFactors key="environmentalFactors" property={property} />
            ) : null}
            {hasAnalysis && (
              <PropertyAnalysis property={property} excludeSections={excludeSections} />
            )}
          </Box>

          {isLoading && (
            <Box className="mt-4 items-center px-4">
              <Loading />
              <Text className="text-text-secondary mt-2 text-xs">
                {t("property_details.loading", {
                  defaultValue: "Fetching additional details…",
                })}
              </Text>
            </Box>
          )}

          {(isLoading || agent.hasAgent) && (
            <Box className="mt-2 px-6 pb-6 lg:hidden">
              <Card border="light" className="p-4">
                {showListingAgentSkeleton ? (
                  <ListingAgentCardSkeleton variant="default" />
                ) : agent.hasAgent ? (
                  <ListingAgentCard
                    imageUrl={agent.imageUrl}
                    displayName={agent.displayName}
                    businessName={agent.businessName}
                    phone={agent.phone}
                    email={agent.email}
                    mlsListingId={mlsListingId}
                    variant="default"
                  />
                ) : null}
              </Card>
            </Box>
          )}
        </Box>

        {/* Sidebar with listing agent card */}
        {(isLoading || agent.hasAgent) && (
          <Box className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <Box className="sticky top-6">
              <Card border="light" className="p-4">
                {showListingAgentSkeleton ? (
                  <ListingAgentCardSkeleton variant="default" className="w-full max-w-none" />
                ) : agent.hasAgent ? (
                  <ListingAgentCard
                    imageUrl={agent.imageUrl}
                    displayName={agent.displayName}
                    businessName={agent.businessName}
                    phone={agent.phone}
                    email={agent.email}
                    mlsListingId={mlsListingId}
                    variant="default"
                    className="w-full max-w-none"
                  />
                ) : null}
              </Card>
            </Box>
          </Box>
        )}
      </Box>
      <MlsListingComplianceFooter />
    </Box>
  );
};
