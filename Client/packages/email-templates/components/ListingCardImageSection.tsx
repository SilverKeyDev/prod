// @ts-expect-error - React needed at runtime for React Email
import React from "react";

import { Img } from "@react-email/components";

import { emailColors } from "./colors";
import type { Listing } from "./listingCardTypes";
import { formatPrice } from "./listingCardUtils";

const BADGE_BASE = {
  position: "absolute" as const,
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "600" as const,
  letterSpacing: "0.3px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  textTransform: "uppercase" as const,
  color: emailColors["background-surface"],
};

type ListingCardImageSectionProps = {
  listing: Listing;
};

export function ListingCardImageSection({ listing }: ListingCardImageSectionProps) {
  const priceCutTop = listing.isNewListing ? "48px" : "16px";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "240px",
        backgroundColor: emailColors["border-light"],
        overflow: "hidden",
      }}
    >
      <Img
        src={listing.imageUrl!}
        alt={listing.address}
        width="600"
        height="240"
        style={{
          width: "100%",
          height: "240px",
          objectFit: "cover",
          display: "block",
        }}
      />
      {listing.isNewListing && (
        <div
          style={{
            ...BADGE_BASE,
            top: "16px",
            left: "16px",
            backgroundColor: `${emailColors.accent}F2`,
          }}
        >
          ✨ New Listing
        </div>
      )}
      {listing.priceCut && (
        <div
          style={{
            ...BADGE_BASE,
            top: priceCutTop,
            left: "16px",
            backgroundColor: `${emailColors.destructive}F2`,
          }}
        >
          🔻 Price Cut: {listing.priceCut.amount}
          {listing.priceCut.percent != null && ` (${listing.priceCut.percent}% off)`}
        </div>
      )}
      {listing.score !== undefined && !listing.priceCut && !listing.isNewListing && (
        <div
          style={{
            ...BADGE_BASE,
            top: "16px",
            left: "16px",
            backgroundColor: `${emailColors.brown.DEFAULT}F2`,
          }}
        >
          {Math.round(listing.score)}% Match
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          backgroundColor: emailColors["background-surface"],
          border: listing.priceCut
            ? `2px solid ${emailColors.destructive}`
            : `1px solid ${emailColors["border-light"]}`,
          padding: "8px 16px",
          borderRadius: "24px",
          fontSize: "16px",
          fontWeight: "700",
          color: listing.priceCut ? emailColors.destructive : emailColors["text-primary"],
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          letterSpacing: "-0.3px",
        }}
      >
        {formatPrice(listing.price)}
      </div>
      {listing.priceCut && (
        <div
          style={{
            position: "absolute",
            top: "56px",
            right: "16px",
            backgroundColor: emailColors["background-surface"],
            border: `1px solid ${emailColors["border-light"]}`,
            padding: "4px 12px",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "500",
            color: emailColors["text-secondary"],
            textDecoration: "line-through",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {formatPrice(listing.priceCut.previousPrice)}
        </div>
      )}
    </div>
  );
}
