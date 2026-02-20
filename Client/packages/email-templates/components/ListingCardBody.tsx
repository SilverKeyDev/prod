// @ts-expect-error - React needed at runtime for React Email
import React from "react";

import { Button, Text } from "@react-email/components";

import { emailColors } from "./colors";
import type { Listing } from "./listingCardTypes";
import {
  formatPrice,
  formatSqft,
  getListingHighlightMessage,
} from "./listingCardUtils";

type ListingCardBodyProps = {
  listing: Listing;
};

const DETAIL_STYLE = {
  fontSize: "14px",
  color: "#6b7280",
  margin: 0,
  fontWeight: "500" as const,
};

export function ListingCardBody({ listing }: ListingCardBodyProps) {
  const highlightMessage = getListingHighlightMessage(listing);
  const hasHighlight = listing.isNewListing || listing.priceCut;

  const buttonBg = listing.priceCut
    ? "rgba(220, 38, 38, 1)"
    : listing.isNewListing
      ? emailColors.gold.DEFAULT
      : emailColors.olive.DEFAULT;
  const buttonShadow = listing.priceCut
    ? "0 2px 4px rgba(220, 38, 38, 0.3)"
    : listing.isNewListing
      ? "0 2px 4px rgba(212, 175, 55, 0.3)"
      : "0 2px 4px rgba(163, 177, 138, 0.3)";

  return (
    <div style={{ padding: "24px" }}>
      <Text
        style={{
          fontSize: "20px",
          fontWeight: "700",
          color: "#1f2937",
          margin: "0 0 12px 0",
          lineHeight: "1.4",
          letterSpacing: "-0.2px",
        }}
      >
        {listing.address}
      </Text>

      {!listing.imageUrl && (
        <div>
          {listing.priceCut ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <Text
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "rgba(220, 38, 38, 1)",
                  margin: 0,
                  lineHeight: "1.3",
                }}
              >
                {formatPrice(listing.price)}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#6b7280",
                  margin: 0,
                  textDecoration: "line-through",
                }}
              >
                {formatPrice(listing.priceCut.previousPrice)}
              </Text>
              <div
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  color: "rgba(220, 38, 38, 1)",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                🔻 {listing.priceCut.amount}
                {listing.priceCut.percent != null &&
                  ` (${listing.priceCut.percent}% off)`}
              </div>
            </div>
          ) : (
            <Text
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: emailColors.brown.DEFAULT,
                margin: "0 0 16px 0",
                lineHeight: "1.3",
              }}
            >
              {formatPrice(listing.price)}
            </Text>
          )}
        </div>
      )}

      {hasHighlight && highlightMessage && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: listing.priceCut
              ? "rgba(220, 38, 38, 0.05)"
              : "rgba(212, 175, 55, 0.05)",
            border: `1px solid ${listing.priceCut ? "rgba(220, 38, 38, 0.2)" : "rgba(212, 175, 55, 0.2)"}`,
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: listing.priceCut
                ? "rgba(220, 38, 38, 1)"
                : emailColors.gold.DEFAULT,
              margin: 0,
              lineHeight: "1.4",
            }}
          >
            {highlightMessage}
          </Text>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "20px",
          paddingBottom: "20px",
          borderBottom: "1px solid #f3f4f6",
          flexWrap: "wrap",
        }}
      >
        {listing.bedrooms !== undefined && listing.bedrooms > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Text style={DETAIL_STYLE}>
              {listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""}
            </Text>
          </div>
        )}
        {listing.bathrooms !== undefined && listing.bathrooms > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "#d1d5db",
              }}
            />
            <Text style={DETAIL_STYLE}>
              {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
            </Text>
          </div>
        )}
        {listing.sqft !== undefined && listing.sqft > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "#d1d5db",
              }}
            />
            <Text style={DETAIL_STYLE}>{formatSqft(listing.sqft)}</Text>
          </div>
        )}
      </div>

      {listing.propertyUrl && (
        <Button
          href={listing.propertyUrl}
          style={{
            backgroundColor: buttonBg,
            color: "#ffffff",
            textDecoration: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            display: "inline-block",
            fontSize: "15px",
            fontWeight: "600",
            letterSpacing: "0.2px",
            boxShadow: buttonShadow,
            transition: "all 0.2s ease",
          }}
        >
          View Full Details →
        </Button>
      )}
    </div>
  );
}
