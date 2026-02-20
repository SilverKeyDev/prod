// @ts-expect-error - React is needed at runtime for React Email rendering
import React from "react";

import { ListingCardBody } from "./ListingCardBody";
import { ListingCardImageSection } from "./ListingCardImageSection";
import type { Listing } from "./listingCardTypes";

export type { Listing } from "./listingCardTypes";

type ListingCardProps = {
  listing: Listing;
  isLast?: boolean;
};

export function ListingCard({ listing, isLast = false }: ListingCardProps) {
  return (
    <div
      style={{
        marginBottom: isLast ? "0" : "32px",
      }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        }}
      >
        {listing.imageUrl && <ListingCardImageSection listing={listing} />}
        <ListingCardBody listing={listing} />
      </div>
    </div>
  );
}
