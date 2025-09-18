import React from "react";

import Card from "../../format/Card";

import type { PropertyComponentProps } from "./types";

export const PropertyFeatures: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { features, image_features: imageFeatures } = property as unknown as {
    features: unknown;
    image_features: unknown;
  };

  if (!features && !imageFeatures) {
    return null;
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-lg font-semibold text-brown">Property Features</h3>
      </div>

      <Card className="p-6 border-r-0">
        {/* AI-detected from images */}
        {imageFeatures &&
          typeof imageFeatures === "object" &&
          "clean" in imageFeatures &&
          Array.isArray((imageFeatures as { clean: unknown }).clean) &&
          (imageFeatures as { clean: string[] }).clean.length > 0 &&
          !(imageFeatures as { error?: unknown }).error && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-brown">
                AI-Detected Features from Photos
              </h4>
              <div className="text-xs leading-relaxed text-brown/70">
                {(imageFeatures as { clean: string[] }).clean.map(
                  (feature: string, i: number) => (
                    <span key={i} className="inline-block">
                      {feature.trim()}
                      {i <
                        (imageFeatures as { clean: string[] }).clean.length -
                          1 && <span className="mx-2 text-brown/40">•</span>}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

        {/* Traditional features */}
        {features && typeof features === "object" && (
          <div className="space-y-4">
            {Object.entries(features as Record<string, string[]>).map(
              ([category, list]) => (
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
              )
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
