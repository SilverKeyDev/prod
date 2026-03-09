import React, { useState } from "react";

import { color } from "packages/design-tokens";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Icon } from "packages/ui/components/primitives";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

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
  const normalized = new Map<string, string>();
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
    normalized.set(normalizedKey, trimmed);
    return true;
  });
};

const deduplicateCategoryFeatures = (feats: Features): Features => {
  const allFeatures = new Set<string>();
  const result: Features = {};
  Object.entries(feats).forEach(([category, list]) => {
    const deduplicated = deduplicateFeatures(list).filter((feature) => {
      const normalized = feature.toLowerCase().replace(/\s+/g, " ");
      if (allFeatures.has(normalized)) return false;
      allFeatures.add(normalized);
      return true;
    });
    if (deduplicated.length > 0) {
      result[category] = deduplicated;
    }
  });
  return result;
};

export const PropertyFeatures: React.FC<PropertyComponentProps> = ({ property }) => {
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
      <Box className="mb-4 flex-row items-center gap-2">
        <Text className="text-brown text-lg font-semibold">Property Features</Text>
      </Box>

      <Box className="border-beige/30 mt-2 rounded-lg border border-r-0 bg-white p-6">
        {img && img.clean.length > 0 && (
          <Box className="mb-4">
            <Text className="text-brown mb-2 text-left text-sm font-semibold">
              AI-Detected Features
            </Text>
            <Text className="text-brown/70 text-left text-xs leading-relaxed">
              {img.clean.map((feature, i) => (
                <React.Fragment key={i}>
                  {feature.trim()}
                  {i < img.clean.length - 1 && " • "}
                </React.Fragment>
              ))}
            </Text>
          </Box>
        )}

        {feats && (
          <Box className="gap-4">
            {Object.entries(feats).map(([category, list]) => {
              const isExpanded = expandedCategories.has(category);
              const displayName = category.replace(/_/g, " ");
              return (
                <Box key={category}>
                  <Pressable
                    onPress={() => toggleCategory(category)}
                    className="mb-2 w-full flex-row items-center justify-between"
                  >
                    <Text className="text-brown flex-1 text-left text-sm font-semibold capitalize">
                      {displayName} ({list.length})
                    </Text>
                    <Icon
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={color("brown.DEFAULT")}
                    />
                  </Pressable>
                  {isExpanded && (
                    <Box className="flex-row flex-wrap gap-2">
                      {list.map((feature, idx) => (
                        <Box key={idx} className="rounded-full bg-gray-100 px-3 py-1">
                          <Text className="text-left text-xs text-gray-700">{feature}</Text>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};
