import React from "react";

import { useLocalization } from "packages/contexts";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui/index.web";

import type { PropertyComponentProps } from "./types";

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
    (v) =>
      Array.isArray(v) && (v as unknown[]).every((s) => typeof s === "string"),
  );
}

export const PropertyFeatures: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { t } = useLocalization();
  const { features, image_features: imageFeatures } = property as unknown as {
    features: unknown;
    image_features: unknown;
  };

  const img =
    isImageFeatures(imageFeatures) && !imageFeatures.error
      ? imageFeatures
      : null;
  const feats = isFeatures(features) ? features : null;

  if (!img && !feats) return null;

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Title as="h3" size="lg" className="font-semibold text-brown">
          {t("property_details.property_features")}
        </Title>
      </div>

      <Card className="p-6 border-r-0">
        {img && img.clean.length > 0 && (
          <div className="mb-4">
            <Title as="h4" size="sm" className="mb-2 font-semibold text-gold">
              {t("property_details.ai_detected_features")}
            </Title>
            <div className="text-xs leading-relaxed text-brown/70">
              {img.clean.map((feature, i) => (
                <BodyText key={i} as="span" className="inline-block">
                  {feature.trim()}
                  {i < img.clean.length - 1 && (
                    <BodyText as="span" className="mx-2 text-brown/40">
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
                  className="mb-2 font-semibold capitalize text-brown"
                >
                  {category.replace(/_/g, " ")}
                </Title>
                <div className="flex flex-wrap gap-2">
                  {list.map((feature, idx) => (
                    <BodyText
                      key={idx}
                      as="span"
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
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
