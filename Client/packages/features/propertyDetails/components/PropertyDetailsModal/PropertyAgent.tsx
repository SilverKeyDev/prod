import React from "react";

import { Phone, User } from "lucide-react";

import { Box } from "packages/ui/components/structure/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import AppImage from "@/components/ui/asset/AppImage";

import type { PropertyComponentProps } from "./types";

const formatPhoneNumber = (phone: Record<string, unknown>): string => {
  const toString = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return "";
  };

  const areacode = toString(phone.areacode);
  const prefix = toString(phone.prefix);
  const number = toString(phone.number);

  if (areacode && prefix && number) {
    return `(${areacode}) ${prefix}-${number}`;
  }

  return areacode || prefix || number || "Phone available";
};

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
    <Box className="space-y-4">
      <Box className="flex items-center gap-2">
        <User className="h-5 w-5 text-gray-600" />
        <Title as="h3" size="sm" className="text-brown">
          Listing Agent
        </Title>
      </Box>

      <Card className="p-4">
        <Box className="flex items-start gap-4">
          <Box className="border-brown/20 bg-brown/10 h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2">
            {imageUrl ? (
              <AppImage
                uri={imageUrl}
                alt={displayName ?? "Listing Agent"}
                className="h-full w-full object-cover"
              />
            ) : (
              <Box className="flex h-full w-full items-center justify-center">
                <User className="text-brown/60 h-8 w-8" />
              </Box>
            )}
          </Box>

          <Box className="flex flex-1 flex-col gap-1">
            <Title as="h4" size="sm" className="text-gold">
              {displayName}
            </Title>
            {businessName && (
              <BodyText size="sm" className="text-brown/70">
                {businessName}
              </BodyText>
            )}
            {phone && (
              <Box className="text-brown mt-1 flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                <BodyText size="sm" className="text-brown">
                  {formatPhoneNumber(phone)}
                </BodyText>
              </Box>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};
