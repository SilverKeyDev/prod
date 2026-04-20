import React from "react";

import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

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
  return Object.values(x as Record<string, unknown>).every(
    (v) => Array.isArray(v) && (v as unknown[]).every((s) => typeof s === "string")
  );
}

export const PropertyFeatures: React.FC<PropertyComponentProps> = ({ property }) => {
  const { features, image_features: imageFeatures } = property as unknown as {
    features: unknown;
    image_features: unknown;
  };

  const img = isImageFeatures(imageFeatures) && !imageFeatures.error ? imageFeatures : null;
  const feats = isFeatures(features) ? features : null;

  if (!img && !feats) return null;

  return (
    <Box className="px-6 py-6">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Title as="h3" size="sm" className="text-brown text-lg font-semibold">
          Property Features
        </Title>
      </Box>

      <Card className="border-r-0 p-6">
        {img && img.clean.length > 0 && (
          <Box className="mb-4">
            <Title as="h4" size="sm" className="text-gold mb-2 text-sm font-semibold">
              Detected features
            </Title>
            <Box className="text-brown/70 text-xs leading-relaxed">
              {img.clean.map((feature, i) => (
                <React.Fragment key={i}>
                  <BodyText as="span" size="xs" className="inline-block">
                    {feature.trim()}
                  </BodyText>
                  {i < img.clean.length - 1 && (
                    <BodyText as="span" size="xs" className="text-brown/40 mx-2 inline">
                      •
                    </BodyText>
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        )}

        {feats && (
          <Box className="flex flex-col gap-4">
            {Object.entries(feats).map(([category, list]) => (
              <Box key={category}>
                <Title
                  as="h4"
                  size="sm"
                  className="text-brown mb-2 text-sm font-semibold capitalize"
                >
                  {category.replace(/_/g, " ")}
                </Title>
                <Box className="flex flex-row flex-wrap gap-2">
                  {list.map((feature, idx) => (
                    <BodyText
                      key={idx}
                      as="span"
                      size="xs"
                      className="rounded-full bg-gray-100 px-3 py-1 text-gray-700"
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
