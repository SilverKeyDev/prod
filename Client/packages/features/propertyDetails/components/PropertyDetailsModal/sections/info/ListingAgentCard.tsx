import React from "react";

import { Icon } from "@ui/icons";

import { BodyText, Title } from "packages/ui/components/index.web";
import { Image } from "packages/ui/components/primitives/media";

import { formatAgentPhoneNumber } from "./propertyDetailsDisplayHelpers";
type ListingAgentCardProps = {
  imageUrl?: string;
  displayName?: string;
  businessName?: string;
  phone?: Record<string, unknown>;
  title?: string;
};
export function ListingAgentCard({
  imageUrl,
  displayName,
  businessName,
  phone,
  title = "Listing Agent",
}: ListingAgentCardProps) {
  return (
    <div className="lg:col-span-1">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="user" className="text-brown h-5 w-5" />
        <Title as="h3" size="lg" className="text-brown font-semibold">
          {title}
        </Title>
      </div>
      <div className="flex items-start space-x-4">
        <div className="border-brown/20 bg-brown/10 h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName ?? title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon name="user" className="text-brown/60 h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex-1">
          {displayName && (
            <Title as="h4" size="lg" className="text-gold font-medium">
              {displayName}
            </Title>
          )}
          {businessName && (
            <BodyText as="p" className="text-brown/70">
              {businessName}
            </BodyText>
          )}
          {phone && (
            <div className="text-brown mt-2 flex items-center">
              <Icon name="phone" className="mr-1 h-4 w-4" />
              {formatAgentPhoneNumber(phone)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
