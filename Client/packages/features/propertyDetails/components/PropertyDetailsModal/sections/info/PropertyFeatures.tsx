import React, { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { BodyText, Button, Title } from "packages/ui/components/index.web";

import Card from "@/components/layout/Card.web";
import type { PropertyComponentProps } from "@/components/modals/PropertyDetailsModal/types";

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
    <div className="px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Title as="h3" size="lg" className="text-brown font-semibold">
          Property Features
        </Title>
      </div>

      <Card className="mt-2 border-r-0 p-6">
        {img && img.clean.length > 0 && (
          <div className="mb-4 text-left">
            <Title as="h4" size="sm" className="text-brown mb-2 text-left font-semibold">
              AI-Detected Features
            </Title>
            <div className="text-brown/70 text-left text-xs leading-relaxed">
              {img.clean.map((feature, i) => (
                <BodyText key={i} as="span" className="inline-block text-left">
                  {feature.trim()}
                  {i < img.clean.length - 1 && (
                    <BodyText as="span" className="text-brown/40 mx-2">
                      •
                    </BodyText>
                  )}
                </BodyText>
              ))}
            </div>
          </div>
        )}

        {feats && (
          <div className="space-y-4 text-left">
            {Object.entries(feats).map(([category, list]) => {
              const isExpanded = expandedCategories.has(category);
              const displayName = category.replace(/_/g, " ");

              return (
                <div key={category} className="text-left">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleCategory(category)}
                    className="hover:text-brown/80 mb-2 flex w-full items-center justify-between text-left transition-colors"
                  >
                    <Title
                      as="h4"
                      size="sm"
                      className="text-brown text-left font-semibold capitalize"
                    >
                      {displayName} ({list.length})
                    </Title>
                    {isExpanded ? (
                      <ChevronUp className="text-brown h-4 w-4" />
                    ) : (
                      <ChevronDown className="text-brown h-4 w-4" />
                    )}
                  </Button>
                  {isExpanded && (
                    <div className="flex flex-wrap gap-2 text-left">
                      {list.map((feature, idx) => (
                        <BodyText
                          key={idx}
                          as="span"
                          className="rounded-full bg-gray-100 px-3 py-1 text-left text-xs text-gray-700"
                        >
                          {feature}
                        </BodyText>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
