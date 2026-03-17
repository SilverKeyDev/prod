import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Image } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

export const PropertyAgent: React.FC<PropertyComponentProps> = ({ property }) => {
  const { t } = useLocalization();
  const listedBy = (
    property as unknown as {
      listed_by: unknown;
    }
  ).listed_by;
  if (!listedBy || typeof listedBy !== "object") {
    return null;
  }
  const agent = listedBy as Record<string, unknown>;
  const imageUrl = agent.image_url as string | undefined;
  const displayName = agent.display_name as string | undefined;
  const businessName = agent.business_name as string | undefined;
  const phone = agent.phone as Record<string, unknown> | undefined;
  return (
    <Box>
      <Box className="mb-4 flex items-center gap-2">
        <Icon name="user" className="text-text-secondary h-5 w-5" />
        <Title as="h3" size="lg" className="text-text-secondary font-semibold">
          {t("property_details.listing_agent")}
        </Title>
      </Box>

      <Card className="p-4">
        <Box className="flex items-start space-x-4">
          <Box className="border-brown/20 bg-primary-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={displayName ?? t("property_details.listing_agent")}
                className="h-full w-full object-cover"
              />
            ) : (
              <Box
                className={`h-full w-full items-center justify-center ${imageUrl ? "hidden" : "flex"}`}
              >
                <Icon name="user" className="text-text-secondary h-8 w-8" />
              </Box>
            )}
          </Box>

          <Box className="flex-1">
            <Title as="h4" size="lg" className="text-accent font-medium">
              {displayName}
            </Title>
            {businessName && (
              <BodyText as="p" className="text-text-secondary">
                {businessName}
              </BodyText>
            )}
            {phone && (
              <Box className="text-text-secondary mt-2 flex items-center">
                <Icon name="phone" className="mr-1 h-4 w-4" />

                {(() => {
                  const ph = phone;
                  if (!ph) return "Phone available";
                  const { areacode, prefix, number } = ph;
                  // Type-safe string conversion with proper type guards
                  const safeStringify = (value: unknown): string => {
                    if (typeof value === "string") return value;
                    if (typeof value === "number") return String(value);
                    if (value === null || value === undefined) return "";
                    if (typeof value === "object" && value !== null) {
                      try {
                        return JSON.stringify(value);
                      } catch {
                        return "[Object]";
                      }
                    }
                    try {
                      if (typeof value === "string") return value;
                      if (typeof value === "number") return String(value);
                      if (typeof value === "boolean") return String(value);
                      if (value === null || value === undefined) return "";
                      return "[Unknown]";
                    } catch {
                      return "[Unknown]";
                    }
                  };
                  if (areacode && prefix && number) {
                    return `(${safeStringify(areacode)}) ${safeStringify(prefix)}-${safeStringify(number)}`;
                  }
                  return (
                    (typeof areacode === "string" ? areacode : null) ??
                    (typeof prefix === "string" ? prefix : null) ??
                    (typeof number === "string" ? number : null) ??
                    "Phone available"
                  );
                })()}
              </Box>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};
