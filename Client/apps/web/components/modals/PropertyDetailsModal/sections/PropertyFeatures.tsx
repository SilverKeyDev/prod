import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Card from "../../../layout/Card";
import type { PropertyComponentProps } from "../types";

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
      Array.isArray(v) && (v as unknown[]).every((s) => typeof s === "string")
  );
}

// Helper function to deduplicate features
const deduplicateFeatures = (features: string[]): string[] => {
  const seen = new Set<string>();
  const normalized = new Map<string, string>();

  return features.filter((feature) => {
    const trimmed = feature.trim();
    if (!trimmed) return false;

    // Normalize for comparison (lowercase, remove extra spaces)
    const normalizedKey = trimmed.toLowerCase().replace(/\s+/g, " ");

    // Skip if already seen
    if (seen.has(normalizedKey)) return false;

    // Skip common unneeded features
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

// Helper function to deduplicate across categories
const deduplicateCategoryFeatures = (feats: Features): Features => {
  const allFeatures = new Set<string>();
  const result: Features = {};

  Object.entries(feats).forEach(([category, list]) => {
    const deduplicated = deduplicateFeatures(list).filter((feature) => {
      const normalized = feature.toLowerCase().replace(/\s+/g, " ");
      if (allFeatures.has(normalized)) {
        return false; // Skip duplicates across categories
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

export const PropertyFeatures: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const { features, image_features: imageFeatures } = property as unknown as {
    features: unknown;
    image_features: unknown;
  };

  const img =
    isImageFeatures(imageFeatures) && !imageFeatures.error
      ? { ...imageFeatures, clean: deduplicateFeatures(imageFeatures.clean) }
      : null;
  const feats = isFeatures(features)
    ? deduplicateCategoryFeatures(features)
    : null;

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
        <h3 className="text-lg font-semibold text-brown">Property Features</h3>
      </div>

      <Card className="p-6 border-r-0 mt-2">
        {img && img.clean.length > 0 && (
          <div className="mb-4 text-left">
            <h4 className="mb-2 text-sm font-semibold text-brown text-left">
              AI-Detected Features
            </h4>
            <div className="text-xs leading-relaxed text-brown/70 text-left">
              {img.clean.map((feature, i) => (
                <span key={i} className="inline-block text-left">
                  {feature.trim()}
                  {i < img.clean.length - 1 && (
                    <span className="mx-2 text-brown/40">•</span>
                  )}
                </span>
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
                  <button
                    onClick={() => toggleCategory(category)}
                    className="mb-2 flex w-full items-center justify-between text-left hover:text-brown/80 transition-colors"
                  >
                    <h4 className="text-sm font-semibold capitalize text-brown text-left">
                      {displayName} ({list.length})
                    </h4>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-brown" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-brown" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="flex flex-wrap gap-2 text-left">
                      {list.map((feature, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 text-left"
                        >
                          {feature}
                        </span>
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
