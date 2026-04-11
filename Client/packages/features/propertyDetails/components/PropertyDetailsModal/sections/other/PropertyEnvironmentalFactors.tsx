import React, { useMemo } from "react";

import { Cloud, Droplets, Flame, Volume2, Wind } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { SectionTintWrapper } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/SectionTintWrapper";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations/PropertySectionHeader";
import type { PropertyWithAnalysis } from "packages/types/property-analysis";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import {
  type EnvironmentalFactorScoreKey,
  getClimateEnvironmentalSection,
  hasEnvironmentalFactorsContent,
  parseEnvironmentalSection,
} from "packages/utils/propertyDetails";

const FACTOR_LABEL_KEYS: Record<EnvironmentalFactorScoreKey, string> = {
  noise_pollution_score: "property_details.environmental_factor_noise",
  fire_score: "property_details.environmental_factor_fire",
  wind_score: "property_details.environmental_factor_wind",
  air_pollution_score: "property_details.environmental_factor_air",
  humidity_score: "property_details.environmental_factor_humidity",
};

const FACTOR_DEFAULT_LABELS: Record<EnvironmentalFactorScoreKey, string> = {
  noise_pollution_score: "Noise pollution",
  fire_score: "Fire",
  wind_score: "Wind",
  air_pollution_score: "Air pollution",
  humidity_score: "Humidity",
};

const FACTOR_ICONS: Record<
  EnvironmentalFactorScoreKey,
  React.ComponentType<{ className?: string }>
> = {
  noise_pollution_score: Volume2,
  fire_score: Flame,
  wind_score: Wind,
  air_pollution_score: Cloud,
  humidity_score: Droplets,
};

export const PropertyEnvironmentalFactors: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { t } = useLocalization();
  const raw = useMemo(() => {
    const pa = (property as PropertyWithAnalysis).property_analysis as
      | Record<string, unknown>
      | undefined;
    return getClimateEnvironmentalSection(pa);
  }, [property]);

  const parsed = useMemo(() => {
    if (!hasEnvironmentalFactorsContent(raw)) return null;
    return parseEnvironmentalSection(raw);
  }, [raw]);

  if (!parsed) return null;

  const { headerRating, factors } = parsed;
  const hasAnyScore = factors.some((f) => f.rating !== null);

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="shield"
        title={t("property_details.environmental_factors_heading", {
          defaultValue: "Environmental factors",
        })}
        className="!mb-4"
        action={<PropertySectionRatingBadge rating={headerRating} />}
      />
      <SectionTintWrapper className="mt-2">
        {hasAnyScore ? (
          <Box className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {factors.map(({ key, rating }) => {
              const IconComponent = FACTOR_ICONS[key];
              return (
                <Box
                  key={key}
                  className="border-border-card-subtle bg-background-surface flex min-w-0 flex-row items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <Box className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 shrink-0 text-gray-600" />
                    <BodyText
                      as="span"
                      size="sm"
                      className="text-text-primary font-medium"
                    >
                      {t(FACTOR_LABEL_KEYS[key], {
                        defaultValue: FACTOR_DEFAULT_LABELS[key],
                      })}
                    </BodyText>
                  </Box>
                  {rating !== null ? (
                    <PropertySectionRatingBadge rating={rating} />
                  ) : (
                    <BodyText
                      as="span"
                      size="sm"
                      className="text-text-secondary shrink-0"
                    >
                      {t("property_details.environmental_factor_no_score", {
                        defaultValue: "—",
                      })}
                    </BodyText>
                  )}
                </Box>
              );
            })}
          </Box>
        ) : null}
      </SectionTintWrapper>
    </Box>
  );
};
