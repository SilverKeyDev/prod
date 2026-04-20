import React, { useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { ListingAgentCard } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/agent/ListingAgentCard";
import { ListingAgentCardSkeleton } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/agent/ListingAgentCardSkeleton";
import {
  getAgentFromProperty,
  getMlsListingId,
} from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";
import {
  buildHomeDetailsColumns,
  countHomeDetailsBlocks,
} from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/homeDetails/columns";
import { HomeDetailsGrid } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/homeDetails/HomeDetailsGrid";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { buildCategoryBlocks } from "packages/features/propertyDetails/utils/propertyFeaturesHelpers";
import Button from "packages/ui/components/button/Button";
import Card from "packages/ui/components/cards/Card";
import { buildDropdownButtonClasses } from "packages/ui/components/form/dropdown/dropdownStyles";
import { Box, Icon } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

export type PropertyFeaturesProps = PropertyComponentProps & {
  hideListingAgentOnMdUp?: boolean;
  isLoading?: boolean;
  /** When false, the inline listing agent card is omitted (rendered elsewhere). Default true. */
  includeListingAgent?: boolean;
};

export const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({
  property,
  hideListingAgentOnMdUp: _hideListingAgentOnMdUp = false,
  isLoading = false,
  includeListingAgent = true,
}) => {
  const { t } = useLocalization();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const agent = getAgentFromProperty(property);
  const mlsListingId = useMemo(() => getMlsListingId(property), [property]);

  const columns = useMemo(
    () => buildHomeDetailsColumns(property as unknown as Record<string, unknown>, t),
    [property, t]
  );
  const blockCount = countHomeDetailsBlocks(columns);
  const showHomeDetails = blockCount > 0;

  const { features, image_features: _imageFeatures } = property as unknown as {
    features: unknown;
    image_features: unknown;
  };

  const categoryBlocks = buildCategoryBlocks(
    null,
    features,
    t("property_details.ai_detected_features", {
      defaultValue: "Detected features",
    })
  );
  const showFeaturesGrid = !!(categoryBlocks && categoryBlocks.length > 0);
  const collapseAdvancedBlock = showHomeDetails && showFeaturesGrid;

  const advancedTriggerClasses = useMemo(
    () =>
      buildDropdownButtonClasses(
        getSharedInputTextStyles,
        "default",
        "md",
        false,
        undefined,
        undefined,
        ""
      ),
    []
  );

  const showAgentSection = includeListingAgent && (isLoading || agent.hasAgent);

  const safeCategoryBlocks = categoryBlocks ?? [];
  const featureCategoryItems = safeCategoryBlocks.map((block) => (
    <Box key={block.key} className="flex h-full min-w-0 flex-row items-start gap-3">
      <Icon name={block.icon} size={18} className="text-text-primary mt-0.5 shrink-0" aria-hidden />
      <Box className="flex min-w-0 flex-1 flex-col gap-1">
        <Title as="h4" size="sm" className="text-foreground font-semibold">
          {block.title}
        </Title>
        {(block.lines ?? []).map((line, index) => (
          <BodyText key={`${block.key}-${index}`} as="p" size="sm" className="leading-snug">
            {line}
          </BodyText>
        ))}
      </Box>
    </Box>
  ));

  if (!showHomeDetails && !showFeaturesGrid && !showAgentSection) return null;

  return (
    <Box className="px-6 py-6">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          {t("property_details.property_features", {
            defaultValue: "Property Features",
          })}
        </Title>
      </Box>

      <Card border="light" className="mt-2 border-r-0 p-6">
        {showHomeDetails ? <HomeDetailsGrid columns={columns} /> : null}
        {collapseAdvancedBlock ? (
          <>
            <Box className="border-border mt-8 border-t pt-8" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              contentAlign="start"
              onClick={() => setAdvancedOpen((open) => !open)}
              aria-expanded={advancedOpen}
              aria-controls="property-features-advanced"
              className={advancedTriggerClasses}
            >
              <Box className="flex w-full min-w-0 flex-row items-center justify-between gap-2">
                <BodyText
                  as="span"
                  className="min-w-0 flex-1 whitespace-normal break-words text-left text-xs leading-snug text-gray-600 sm:text-sm md:text-base"
                >
                  {advancedOpen
                    ? t("property_details.hide_advanced_details", {
                        defaultValue: "Hide advanced details",
                      })
                    : t("property_details.advanced_details", {
                        defaultValue: "Advanced details",
                      })}
                </BodyText>
                <Icon
                  name="chevron-down"
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    advancedOpen ? "rotate-180 transform" : ""
                  }`}
                  aria-hidden
                />
              </Box>
            </Button>
            {advancedOpen ? (
              <Box
                id="property-features-advanced"
                className="mt-8 grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12"
              >
                {featureCategoryItems}
              </Box>
            ) : null}
          </>
        ) : showFeaturesGrid ? (
          <Box className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {featureCategoryItems}
          </Box>
        ) : null}
        {showAgentSection ? (
          <Box className="mt-6 lg:hidden">
            {isLoading && !agent.hasAgent ? (
              <ListingAgentCardSkeleton />
            ) : agent.hasAgent ? (
              <ListingAgentCard
                imageUrl={agent.imageUrl}
                displayName={agent.displayName}
                businessName={agent.businessName}
                phone={agent.phone}
                email={agent.email}
                mlsListingId={mlsListingId}
              />
            ) : null}
          </Box>
        ) : null}
      </Card>
    </Box>
  );
};
