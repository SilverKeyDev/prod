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
import { Box, Icon, Pressable, Text } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";

export type PropertyFeaturesProps = PropertyComponentProps & {
  hideListingAgentOnMdUp?: boolean;
  isLoading?: boolean;
  /** When false, the inline listing agent card is omitted (rendered elsewhere). Default true. */
  includeListingAgent?: boolean;
};

export const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({
  property,
  hideListingAgentOnMdUp = false,
  isLoading = false,
  includeListingAgent = true,
}) => {
  const { t } = useLocalization();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const agent = getAgentFromProperty(property);
  const mlsListingId = useMemo(() => getMlsListingId(property), [property]);
  const agentHiddenFromMdUp = hideListingAgentOnMdUp && agent.hasAgent;

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

  const showAgentSection = includeListingAgent && (isLoading || agent.hasAgent);

  const featureCategoryItems = categoryBlocks.map((block) => (
    <Box key={block.key} className="flex-row items-start gap-3">
      <Icon name={block.icon} size={18} className="text-text-primary mt-0.5 shrink-0" />
      <Box className="flex-1 gap-1">
        <Title as="h4" size="sm" className="text-foreground font-semibold">
          {block.title}
        </Title>
        {block.lines.map((line, index) => (
          <Text key={`${block.key}-${index}`} className="text-text-primary text-sm leading-snug">
            {line}
          </Text>
        ))}
      </Box>
    </Box>
  ));

  if (!showHomeDetails && !showFeaturesGrid && !showAgentSection) return null;

  return (
    <Box className="px-6 py-6">
      <Box className="mb-4 flex-row items-center gap-2">
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          {t("property_details.property_features", {
            defaultValue: "Property Features",
          })}
        </Title>
      </Box>

      <Box className="border-border bg-background-surface mt-2 rounded-lg border border-r-0 p-6">
        {showHomeDetails ? <HomeDetailsGrid columns={columns} /> : null}
        {collapseAdvancedBlock ? (
          <>
            <Box className="border-border mt-8 border-t pt-8" />
            <Pressable
              onPress={() => setAdvancedOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityState={{ expanded: advancedOpen }}
              label={
                advancedOpen
                  ? t("property_details.hide_advanced_details", {
                      defaultValue: "Hide advanced details",
                    })
                  : t("property_details.advanced_details", {
                      defaultValue: "Advanced details",
                    })
              }
              className="border-border bg-background-surface mt-2 flex w-full flex-row items-center justify-between rounded-lg border px-4 py-3"
            >
              <Text className="text-text-primary flex-1 text-left text-sm">
                {advancedOpen
                  ? t("property_details.hide_advanced_details", {
                      defaultValue: "Hide advanced details",
                    })
                  : t("property_details.advanced_details", {
                      defaultValue: "Advanced details",
                    })}
              </Text>
              <Icon
                name="chevron-down"
                className={`text-text-primary h-4 w-4 shrink-0 ${advancedOpen ? "rotate-180" : ""}`}
              />
            </Pressable>
            {advancedOpen ? <Box className="mt-6 gap-6">{featureCategoryItems}</Box> : null}
          </>
        ) : showFeaturesGrid ? (
          <Box className="gap-6">{featureCategoryItems}</Box>
        ) : null}
        {showAgentSection ? (
          <Box className={`mt-6 ${agentHiddenFromMdUp ? "md:hidden" : ""}`}>
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
      </Box>
    </Box>
  );
};
