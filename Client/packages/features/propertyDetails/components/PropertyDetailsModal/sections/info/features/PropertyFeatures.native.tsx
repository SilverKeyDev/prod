import React, { useMemo } from "react";

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
import { Box, Icon, Text } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";

export type PropertyFeaturesProps = PropertyComponentProps & {
  hideListingAgentOnMdUp?: boolean;
  isLoading?: boolean;
};

export const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({
  property,
  hideListingAgentOnMdUp = false,
  isLoading = false,
}) => {
  const { t } = useLocalization();
  const agent = getAgentFromProperty(property);
  const mlsListingId = useMemo(() => getMlsListingId(property), [property]);
  const agentHiddenFromMdUp = hideListingAgentOnMdUp && agent.hasAgent;

  const columns = useMemo(
    () =>
      buildHomeDetailsColumns(
        property as unknown as Record<string, unknown>,
        t,
      ),
    [property, t],
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
      defaultValue: "AI-Detected Features",
    }),
  );
  const showFeaturesGrid = !!(categoryBlocks && categoryBlocks.length > 0);

  const showAgentSection = isLoading || agent.hasAgent;

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
        {showHomeDetails && showFeaturesGrid ? (
          <Box className="border-border mt-8 border-t pt-8" aria-hidden />
        ) : null}
        {showFeaturesGrid ? (
          <Box className="gap-6">
            {categoryBlocks.map((block) => (
              <Box key={block.key} className="flex-row items-start gap-3">
                <Icon
                  name={block.icon}
                  size={18}
                  className="text-text-primary mt-0.5 shrink-0"
                />
                <Box className="flex-1 gap-1">
                  <Title
                    as="h4"
                    size="sm"
                    className="text-foreground font-semibold"
                  >
                    {block.title}
                  </Title>
                  {block.lines.map((line, index) => (
                    <Text
                      key={`${block.key}-${index}`}
                      className="text-text-primary text-sm leading-snug"
                    >
                      {line}
                    </Text>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ) : null}
        {showAgentSection ? (
          <Box className={`mt-6 ${agentHiddenFromMdUp ? "md:hidden" : ""}`}>
            {isLoading ? (
              <ListingAgentCardSkeleton />
            ) : (
              <ListingAgentCard
                imageUrl={agent.imageUrl}
                displayName={agent.displayName}
                businessName={agent.businessName}
                phone={agent.phone}
                email={agent.email}
                mlsListingId={mlsListingId}
              />
            )}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
