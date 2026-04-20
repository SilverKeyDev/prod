import React from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

type ImageFeatures = { clean: string[]; error?: unknown };
type Features = Record<string, string[]>;

function _isImageFeatures(x: unknown): x is ImageFeatures {
  return (
    typeof x === "object" &&
    x !== null &&
    "clean" in x &&
    Array.isArray((x as Record<string, unknown>).clean)
  );
}

function isFeatures(x: unknown): x is Features {
  if (typeof x !== "object" || x === null) return false;
  // Optional: be strict about value shapes
  return Object.values(x as Record<string, unknown>).every(
    (v) => Array.isArray(v) && (v as unknown[]).every((s) => typeof s === "string")
  );
}

export const PropertyFeatures: React.FC<PropertyComponentProps> = ({ property }) => {
  const { t } = useLocalization();
  const { features, image_features: _imageFeatures } = property as unknown as {
    features: unknown;
    image_features: unknown;
  };

  // Only show structured features (AI-detected features are now in Home Details)
  const feats = isFeatures(features) ? features : null;

  if (!feats) return null;

  return (
    <Box className="px-6 py-6">
      <Box className="mb-4 flex items-center gap-2">
        <Title as="h3" size="lg" className="text-text-secondary font-semibold">
          {t("property_details.property_features")}
        </Title>
      </Box>

      <Card border="light" className="border-r-0 p-6">
        {feats && (
          <Box className="space-y-4">
            {Object.entries(feats)
              .filter(([category]) => {
                // Filter out architectural_style category
                const normalizedCategory = category.toLowerCase().replace(/[_\s-]/g, "");
                return normalizedCategory !== "architecturalstyle";
              })
              .map(([category, list]) => (
                <Box key={category}>
                  <Title
                    as="h4"
                    size="sm"
                    className="text-text-secondary mb-2 font-semibold capitalize"
                  >
                    {category.replace(/_/g, " ")}
                  </Title>
                  <Box className="flex flex-wrap gap-2">
                    {list.map((feature, idx) => (
                      <BodyText
                        key={idx}
                        as="span"
                        className="bg-primary-muted text-text-secondary rounded-full px-3 py-1 text-xs"
                      >
                        {feature}
                      </BodyText>
                    ))}
                  </Box>
                </Box>
              ))}
          </Box>
        )}
      </Card>
    </Box>
  );
};
