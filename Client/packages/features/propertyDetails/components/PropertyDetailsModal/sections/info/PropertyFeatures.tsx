import React, { useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Button from "packages/ui/components/button/Button";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

type ImageFeatures = {
  clean: string[];
  error?: unknown;
};
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
  return Object.values(x as Record<string, unknown>).every(
    (v) => Array.isArray(v) && (v as unknown[]).every((s) => typeof s === "string")
  );
}
const deduplicateFeatures = (features: string[]): string[] => {
  const seen = new Set<string>();
  return features.filter((feature) => {
    const trimmed = feature.trim();
    if (!trimmed) return false;
    const normalizedKey = trimmed.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(normalizedKey)) return false;
    const unneededPatterns = [
      /^none$/i,
      /^n\/a$/i,
      /^na$/i,
      /^unknown$/i,
      /^not available$/i,
      /^not specified$/i,
      /^null$/i,
      /^undefined$/i,
    ];
    if (unneededPatterns.some((pattern) => pattern.test(trimmed))) {
      return false;
    }
    seen.add(normalizedKey);
    return true;
  });
};
const deduplicateCategoryFeatures = (feats: Features): Features => {
  const allFeatures = new Set<string>();
  const result: Features = {};
  Object.entries(feats).forEach(([category, list]) => {
    const deduplicated = deduplicateFeatures(list).filter((feature) => {
      const normalized = feature.toLowerCase().replace(/\s+/g, " ");
      if (allFeatures.has(normalized)) {
        return false;
      }
      allFeatures.add(normalized);
      return true;
    });
    if (deduplicated.length > 0) {
      result[category] = deduplicated;
    }
  });
  return result;
};

const FEATURE_CHIP =
  "bg-primary-muted text-text-secondary rounded-full px-3 py-1 text-left text-xs";

export const PropertyFeatures: React.FC<PropertyComponentProps> = ({ property }) => {
  const { t } = useLocalization();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { features, image_features: imageFeatures } = property as unknown as {
    features: unknown;
    image_features: unknown;
  };
  const img =
    isImageFeatures(imageFeatures) && !imageFeatures.error
      ? { ...imageFeatures, clean: deduplicateFeatures(imageFeatures.clean) }
      : null;
  const feats = isFeatures(features) ? deduplicateCategoryFeatures(features) : null;
  if (!img && !feats) return null;
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };
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
        {img && img.clean.length > 0 && (
          <Box className="mb-4 text-left">
            <Title as="h4" size="sm" className="text-foreground mb-2 text-left font-semibold">
              {t("property_details.ai_detected_features", {
                defaultValue: "AI-Detected Features",
              })}
            </Title>
            <Box className="flex flex-row flex-wrap gap-2 text-left">
              {img.clean.map((feature, i) => (
                <BodyText key={i} as="span" className={FEATURE_CHIP}>
                  {feature.trim()}
                </BodyText>
              ))}
            </Box>
          </Box>
        )}

        {feats && (
          <Box className="flex flex-col gap-4 text-left">
            {Object.entries(feats).map(([category, list]) => {
              const isExpanded = expandedCategories.has(category);
              const displayName = category.replace(/_/g, " ");
              return (
                <Box key={category} className="text-left">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleCategory(category)}
                    className="hover:text-text-secondary active:text-text-secondary mb-2 flex w-full flex-row items-center justify-between text-left"
                  >
                    <Title
                      as="h4"
                      size="sm"
                      className="text-foreground text-left font-semibold capitalize"
                    >
                      {displayName} ({list.length})
                    </Title>
                    {isExpanded ? (
                      <Icon name="chevron-up" className="text-foreground h-4 w-4" />
                    ) : (
                      <Icon name="chevron-down" className="text-foreground h-4 w-4" />
                    )}
                  </Button>
                  {isExpanded && (
                    <Box className="flex flex-row flex-wrap gap-2 text-left">
                      {list.map((feature, idx) => (
                        <BodyText key={idx} as="span" className={FEATURE_CHIP}>
                          {feature}
                        </BodyText>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
};
