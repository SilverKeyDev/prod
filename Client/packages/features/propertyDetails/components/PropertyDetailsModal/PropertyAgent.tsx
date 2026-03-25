import React from "react";

import { Phone, User } from "lucide-react";

import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import AppImage from "@/components/ui/asset/AppImage";

import type { PropertyComponentProps } from "./types";

export const PropertyAgent: React.FC<PropertyComponentProps> = ({ property }) => {
  const listedBy = (property as unknown as { listed_by: unknown }).listed_by;

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
      <Box className="mb-4 flex flex-row items-center gap-2">
        <User className="h-5 w-5 text-gray-600" />
        <Title as="h3" size="sm" className="text-brown text-lg font-semibold">
          Listing Agent
        </Title>
      </Box>

      <Card className="p-4">
        <Box className="flex flex-row items-start gap-4">
          <Box className="border-brown/20 bg-brown/10 h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2">
            {imageUrl ? (
              <AppImage
                uri={imageUrl}
                alt={displayName ?? "Listing Agent"}
                className="h-full w-full object-cover"
              />
            ) : (
              <Box
                className={`h-full w-full items-center justify-center ${
                  imageUrl ? "hidden" : "flex"
                }`}
              >
                <User className="text-brown/60 h-8 w-8" />
              </Box>
            )}
          </Box>

          <Box className="flex-1">
            <Title as="h4" size="sm" className="text-gold text-lg font-medium">
              {displayName}
            </Title>
            {businessName && (
              <BodyText as="p" size="sm" className="text-brown/70">
                {businessName}
              </BodyText>
            )}
            {phone && (
              <Box className="text-brown mt-2 flex flex-row items-center">
                <Phone className="mr-1 h-4 w-4" />
                <BodyText as="span" size="sm" className="text-brown">
                  {(() => {
                    const ph = phone;
                    if (!ph) return "Phone available";
                    const { areacode, prefix, number } = ph;

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
                </BodyText>
              </Box>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};
