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
import Card from "packages/ui/components/cards/Card";
import { Box, Icon } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

export type PropertyFeaturesProps = PropertyComponentProps & {
  hideListingAgentOnMdUp?: boolean;
  isLoading?: boolean;
};

export const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({
  property,
  hideListingAgentOnMdUp: _hideListingAgentOnMdUp = false,
  isLoading = false,
}) => {
  const { t } = useLocalization();
  const agent = getAgentFromProperty(property);
  const mlsListingId = useMemo(() => getMlsListingId(property), [property]);

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
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          {t("property_details.property_features", {
            defaultValue: "Property Features",
          })}
        </Title>
      </Box>

      <Card border="light" className="mt-2 border-r-0 p-6">
        {showHomeDetails ? <HomeDetailsGrid columns={columns} /> : null}
        {showHomeDetails && showFeaturesGrid ? (
          <Box className="border-border mt-8 border-t pt-8" aria-hidden />
        ) : null}
        {showFeaturesGrid ? (
          <Box className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {categoryBlocks.map((block) => (
              <Box
                key={block.key}
                className="flex min-w-0 flex-row items-start gap-3"
              >
                <Icon
                  name={block.icon}
                  size={18}
                  className="text-text-primary mt-0.5 shrink-0"
                  aria-hidden
                />
                <Box className="flex min-w-0 flex-1 flex-col gap-1">
                  <Title
                    as="h4"
                    size="sm"
                    className="text-foreground font-semibold"
                  >
                    {block.title}
                  </Title>
                  {block.lines.map((line, index) => (
                    <BodyText
                      key={`${block.key}-${index}`}
                      as="p"
                      size="sm"
                      className="leading-snug"
                    >
                      {line}
                    </BodyText>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        ) : null}
        {showAgentSection ? (
          <Box className="mt-6 lg:hidden">
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
      </Card>
    </Box>
  );
};
