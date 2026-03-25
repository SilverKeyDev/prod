import React from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

type ImageFeatures = { clean: string[]; error?: unknown };
type Features = Record<string, string[]>;

function isImageFeatures(x: unknown): x is ImageFeatures {
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
  const { features, image_features: imageFeatures } = property as unknown as {
    features: unknown;
    image_features: unknown;
  };

  const img = isImageFeatures(imageFeatures) && !imageFeatures.error ? imageFeatures : null;
  const feats = isFeatures(features) ? features : null;

  if (!img && !feats) return null;

  return (
    <Box className="px-6 py-6">
      <Box className="mb-4 flex items-center gap-2">
        <Title as="h3" size="lg" className="text-text-secondary font-semibold">
          {t("property_details.property_features")}
        </Title>
      </Box>

      <Card border="light" className="border-r-0 p-6">
        {img && img.clean.length > 0 && (
          <Box className="mb-4">
            <Title as="h4" size="sm" className="text-accent mb-2 font-semibold">
              {t("property_details.ai_detected_features")}
            </Title>
            <Box className="text-text-secondary text-xs leading-relaxed">
              {img.clean.map((feature, i) => (
                <BodyText key={i} as="span" className="inline-block">
                  {feature.trim()}
                  {i < img.clean.length - 1 && (
                    <BodyText as="span" className="text-text-secondary mx-2">
                      {t("property_details.bullet_separator").trim()}
                    </BodyText>
                  )}
                </BodyText>
              ))}
            </Box>
          </Box>
        )}

        {feats && (
          <Box className="space-y-4">
            {Object.entries(feats).map(([category, list]) => (
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
