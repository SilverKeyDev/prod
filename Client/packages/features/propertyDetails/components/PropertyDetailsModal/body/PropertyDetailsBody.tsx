import React, { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { PropertyAnalysis } from "packages/features/propertyDetails/components/PropertyDetailsModal/body/PropertyAnalysis";
import { PropertyDetails } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/PropertyDetails";
import { PropertyFeatures } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/PropertyFeatures";
import { PropertyInfo } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/PropertyInfo";
import { PropertyCommute } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/PropertyCommute";
import { PropertyNeighborhood } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/PropertyNeighborhood";
import { PropertySchools } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/location/PropertySchools";
import { ProsAndCons } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/other/ProsAndCons";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import type { PropertyWithAnalysis } from "packages/types/property-analysis";
import { Box, Text } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";

export type PropertyDetailsBodyProps = PropertyComponentProps & {
  isLoading?: boolean;
};

export const PropertyDetailsBody: React.FC<PropertyDetailsBodyProps> = ({
  property,
  isLoading = false,
}) => {
  const { t } = useLocalization();
  const propertyAnalysis = useMemo(
    () => (property as PropertyWithAnalysis).property_analysis,
    [property]
  );

  const hasCommute = useMemo(() => {
    return !!(property as unknown as { commute_data?: unknown }).commute_data;
  }, [property]);

  const hasSchools = useMemo(() => {
    const schools = (property as unknown as { schools?: unknown }).schools;
    return (
      Array.isArray(schools) &&
      ((property as unknown as { schools?: unknown[] }).schools?.length ?? 0) > 0
    );
  }, [property]);

  const hasFeatures = useMemo(() => {
    return (
      !!(property as unknown as { features?: unknown }).features ||
      !!(property as unknown as { image_features?: unknown }).image_features
    );
  }, [property]);

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
    () =>
      propertyAnalysis
        ? (propertyAnalysis as Record<string, unknown>).neighborhood_overview
        : undefined,
    [propertyAnalysis]
  );
  const hasNeighborhood = useMemo(
    () =>
      !!propertyAnalysis && !!(propertyAnalysis as Record<string, unknown>).neighborhood_overview,
    [propertyAnalysis]
  );

  const excludeSections = useMemo(() => {
    const out: string[] = [];
    if (hasCommute || commuteAnalysis) out.push("commute");
    if (hasSchools || familyFriendlyAnalysis) out.push("family_friendly");
    if (hasNeighborhood || neighborhoodAnalysis) {
      out.push("neighborhood_overview");
      out.push("age_distribution");
    }
    return out;
  }, [
    hasCommute,
    commuteAnalysis,
    hasSchools,
    familyFriendlyAnalysis,
    hasNeighborhood,
    neighborhoodAnalysis,
  ]);

  return (
    <Box className="pb-4">
      <PropertyInfo property={property} />
      <PropertyDetails property={property} />
      <ProsAndCons property={property} />
      {hasFeatures && <PropertyFeatures key="propertyFeatures" property={property} />}

      {/* Dynamic sections in same order as propertyDetailsModalSectionHelpers (by priority: neighborhood 2, commute 3, family_friendly 4, analysis 10) */}
      {(hasNeighborhood || neighborhoodAnalysis) && (
        <PropertyNeighborhood property={property} analysisContent={neighborhoodAnalysis} />
      )}
      {(hasCommute || commuteAnalysis) && (
        <PropertyCommute property={property} analysisContent={commuteAnalysis} />
      )}
      {(hasSchools || familyFriendlyAnalysis) && (
        <PropertySchools property={property} analysisContent={familyFriendlyAnalysis} />
      )}
      {hasAnalysis && <PropertyAnalysis property={property} excludeSections={excludeSections} />}

      {isLoading && (
        <Box className="mt-4 items-center px-4">
          <Loading />
          <Text className="mt-2 text-xs text-gray-600">
            {t("property_details.loading", {
              defaultValue: "Fetching additional details…",
            })}
          </Text>
        </Box>
      )}
    </Box>
  );
};
