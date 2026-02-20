import React from "react";

import { Phone, User } from "lucide-react";

import { BodyText, Image, Title } from "@/components/ui/index.web";

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
        <User className="h-5 w-5 text-brown" />
        <Title as="h3" size="lg" className="font-semibold text-brown">
          {title}
        </Title>
      </div>
      <div className="flex items-start space-x-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-brown/20 bg-brown/10">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName ?? title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <User className="h-8 w-8 text-brown/60" />
            </div>
          )}
        </div>
        <div className="flex-1">
          {displayName && (
            <Title as="h4" size="lg" className="font-medium text-gold">
              {displayName}
            </Title>
          )}
          {businessName && (
            <BodyText as="p" className="text-brown/70">
              {businessName}
            </BodyText>
          )}
          {phone && (
            <div className="mt-2 flex items-center text-brown">
              <Phone className="mr-1 h-4 w-4" />
              {formatAgentPhoneNumber(phone)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
