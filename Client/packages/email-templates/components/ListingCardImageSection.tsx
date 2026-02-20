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
  color: "#ffffff",
};

type ListingCardImageSectionProps = {
  listing: Listing;
};

export function ListingCardImageSection({
  listing,
}: ListingCardImageSectionProps) {
  const priceCutTop = listing.isNewListing ? "48px" : "16px";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "240px",
        backgroundColor: "#f3f4f6",
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
            backgroundColor: "rgba(212, 175, 55, 0.95)",
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
            backgroundColor: "rgba(220, 38, 38, 0.95)",
          }}
        >
          🔻 Price Cut: {listing.priceCut.amount}
          {listing.priceCut.percent != null &&
            ` (${listing.priceCut.percent}% off)`}
        </div>
      )}
      {listing.score !== undefined &&
        !listing.priceCut &&
        !listing.isNewListing && (
          <div
            style={{
              ...BADGE_BASE,
              top: "16px",
              left: "16px",
              backgroundColor: "rgba(139, 111, 90, 0.95)",
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
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          border: listing.priceCut
            ? "2px solid rgba(220, 38, 38, 0.8)"
            : "1px solid rgba(229, 231, 235, 0.8)",
          padding: "8px 16px",
          borderRadius: "24px",
          fontSize: "16px",
          fontWeight: "700",
          color: listing.priceCut
            ? "rgba(220, 38, 38, 1)"
            : emailColors.brown.DEFAULT,
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
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            border: "1px solid rgba(229, 231, 235, 0.8)",
            padding: "4px 12px",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#6b7280",
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
