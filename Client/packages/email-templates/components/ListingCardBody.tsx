// @ts-expect-error - React needed at runtime for React Email
import React from "react";

import { Button, Text } from "@react-email/components";

import { emailColors } from "./colors";
import type { Listing } from "./listingCardTypes";
import { formatPrice, formatSqft, getListingHighlightMessage } from "./listingCardUtils";

type ListingCardBodyProps = {
  listing: Listing;
};

const DETAIL_STYLE = {
  fontSize: "14px",
  color: emailColors["text-secondary"],
  margin: 0,
  fontWeight: "500" as const,
};

export function ListingCardBody({ listing }: ListingCardBodyProps) {
  const highlightMessage = getListingHighlightMessage(listing);
  const hasHighlight = listing.isNewListing || listing.priceCut;

  const buttonBg = listing.priceCut
    ? emailColors.destructive
    : listing.isNewListing
      ? emailColors.accent
      : emailColors.primary;
  const buttonShadow = listing.priceCut
    ? `0 2px 4px ${emailColors.destructive}4D`
    : listing.isNewListing
      ? `0 2px 4px ${emailColors.accent}4D`
      : `0 2px 4px ${emailColors.primary}4D`;

  return (
    <div style={{ padding: "24px" }}>
      <Text
        style={{
          fontSize: "20px",
          fontWeight: "700",
          color: emailColors["text-primary"],
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
                  color: emailColors.destructive,
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
                  color: emailColors["text-secondary"],
                  margin: 0,
                  textDecoration: "line-through",
                }}
              >
                {formatPrice(listing.priceCut.previousPrice)}
              </Text>
              <div
                style={{
                  backgroundColor: `${emailColors.destructive}1A`,
                  color: emailColors.destructive,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                🔻 {listing.priceCut.amount}
                {listing.priceCut.percent != null && ` (${listing.priceCut.percent}% off)`}
              </div>
            </div>
          ) : (
            <Text
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: emailColors["text-primary"],
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
              ? `${emailColors.destructive}0D`
              : `${emailColors.accent}0D`,
            border: `1px solid ${listing.priceCut ? `${emailColors.destructive}33` : `${emailColors.accent}33`}`,
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: listing.priceCut ? emailColors.destructive : emailColors.accent,
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
          borderBottom: `1px solid ${emailColors["border-light"]}`,
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
                backgroundColor: emailColors.border,
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
                backgroundColor: emailColors.border,
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
            color: emailColors["background-surface"],
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
