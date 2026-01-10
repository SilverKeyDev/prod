import React from "react";
import Card from "../../layout/Card";
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
      Array.isArray(v) && (v as unknown[]).every((s) => typeof s === "string")
  );
}

export const PropertyFeatures: React.FC<PropertyComponentProps> = ({
  property,
}) => {
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
        <h3 className="text-lg font-semibold text-brown">Property Features</h3>
      </div>

      <Card className="p-6 border-r-0">
        {img && img.clean.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-gold">
              AI-Detected Features
            </h4>
            <div className="text-xs leading-relaxed text-brown/70">
              {img.clean.map((feature, i) => (
                <span key={i} className="inline-block">
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
          <div className="space-y-4">
            {Object.entries(feats).map(([category, list]) => (
              <div key={category}>
                <h4 className="mb-2 text-sm font-semibold capitalize text-brown">
                  {category.replace(/_/g, " ")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {list.map((feature, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                    >
                      {feature}
                    </span>
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
