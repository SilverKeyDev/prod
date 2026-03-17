import React from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

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
    <div className="px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Title as="h3" size="lg" className="text-text-secondary font-semibold">
          {t("property_details.property_features")}
        </Title>
      </div>

      <Card className="border-r-0 p-6">
        {img && img.clean.length > 0 && (
          <div className="mb-4">
            <Title as="h4" size="sm" className="text-accent mb-2 font-semibold">
              {t("property_details.ai_detected_features")}
            </Title>
            <div className="text-text-secondary text-xs leading-relaxed">
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
            </div>
          </div>
        )}

        {feats && (
          <div className="space-y-4">
            {Object.entries(feats).map(([category, list]) => (
              <div key={category}>
                <Title
                  as="h4"
                  size="sm"
                  className="text-text-secondary mb-2 font-semibold capitalize"
                >
                  {category.replace(/_/g, " ")}
                </Title>
                <div className="flex flex-wrap gap-2">
                  {list.map((feature, idx) => (
                    <BodyText
                      key={idx}
                      as="span"
                      className="bg-primary-muted text-text-secondary rounded-full px-3 py-1 text-xs"
                    >
                      {feature}
                    </BodyText>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
