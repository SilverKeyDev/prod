import React from "react";

import { EmailTemplate } from "../components/EmailTemplate";
import { Listing, ListingCard } from "../components/ListingCard";

export type { Listing };

export type ListingsEmailProps = {
  recipientEmail: string;
  listings: Listing[];
  maxItems?: number;
};

export default function ListingsEmail({
  recipientEmail: _recipientEmail,
  listings,
  maxItems = 10,
}: ListingsEmailProps) {
  const displayListings = listings.slice(0, maxItems);

  return (
    <EmailTemplate
      title="New Property Matches"
      subtitle={`We found ${displayListings.length} property${
        displayListings.length !== 1 ? "ies" : ""
      } that match your preferences`}
    >
      {displayListings.map((listing, index) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isLast={index === displayListings.length - 1}
        />
      ))}
    </EmailTemplate>
  );
}
