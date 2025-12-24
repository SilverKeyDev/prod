import { Button, Img, Text } from "@react-email/components";
// React is required at runtime for server-side rendering, even though TypeScript's new JSX transform doesn't require it in scope
// @ts-ignore - React is needed at runtime for React Email rendering
import React from "react";
import { emailColors } from "./colors";

export type Listing = {
  id: string;
  address: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  score?: number;
  imageUrl?: string;
  propertyUrl?: string;
  isNewListing?: boolean;
  priceCut?: {
    previousPrice: string;
    amount: string;
    percent?: number;
  };
};

type ListingCardProps = {
  listing: Listing;
  isLast?: boolean;
};

const formatPrice = (price: string | number): string => {
  if (typeof price === "number") {
    return `$${price.toLocaleString()}`;
  }
  const priceStr = price.toString().replace(/,/g, "").replace("$", "");
  const priceNum = parseInt(priceStr, 10);
  if (isNaN(priceNum)) return price.toString();
  return `$${priceNum.toLocaleString()}`;
};

const formatSqft = (sqft?: number): string => {
  if (!sqft || sqft <= 0) return "n/a sqft";
  return `${Math.round(sqft).toLocaleString()} sqft`;
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
        {/* Property Image */}
        {listing.imageUrl && (
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
              src={listing.imageUrl}
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
            {/* New Listing Badge - Top Left */}
            {listing.isNewListing && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  backgroundColor: "rgba(212, 175, 55, 0.95)",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  letterSpacing: "0.3px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                  textTransform: "uppercase",
                }}
              >
                ✨ New Listing
              </div>
            )}
            {/* Price Cut Badge - Top Left (if not new listing) or below new listing */}
            {listing.priceCut && (
              <div
                style={{
                  position: "absolute",
                  top: listing.isNewListing ? "48px" : "16px",
                  left: "16px",
                  backgroundColor: "rgba(220, 38, 38, 0.95)",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  letterSpacing: "0.3px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                  textTransform: "uppercase",
                }}
              >
                🔻 Price Cut: {listing.priceCut.amount}
                {listing.priceCut.percent &&
                  ` (${listing.priceCut.percent}% off)`}
              </div>
            )}
            {/* Score Badge - Top Left (if no price cut/new listing conflict) */}
            {listing.score !== undefined &&
              !listing.priceCut &&
              !listing.isNewListing && (
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "16px",
                    backgroundColor: "rgba(139, 111, 90, 0.95)",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    letterSpacing: "0.3px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {Math.round(listing.score)}% Match
                </div>
              )}
            {/* Price Badge - Top Right */}
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
            {/* Previous Price (if price cut) - shown below current price */}
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
        )}

        {/* Property Content */}
        <div style={{ padding: "24px" }}>
          {/* Address */}
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

          {/* Price (if no image) */}
          {!listing.imageUrl && (
            <div>
              {listing.priceCut && (
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
                    {listing.priceCut.percent &&
                      ` (${listing.priceCut.percent}% off)`}
                  </div>
                </div>
              )}
              {!listing.priceCut && (
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

          {/* New Listing or Price Cut Highlight */}
          {(listing.isNewListing || listing.priceCut) && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: listing.priceCut
                  ? "rgba(220, 38, 38, 0.05)"
                  : "rgba(212, 175, 55, 0.05)",
                border: `1px solid ${
                  listing.priceCut
                    ? "rgba(220, 38, 38, 0.2)"
                    : "rgba(212, 175, 55, 0.2)"
                }`,
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
                {listing.isNewListing && listing.priceCut
                  ? "✨ Brand new listing with a recent price reduction!"
                  : listing.isNewListing
                    ? "✨ This is a brand new listing - be among the first to view it!"
                    : listing.priceCut
                      ? `🔻 Price reduced by ${listing.priceCut.amount}${
                          listing.priceCut.percent
                            ? ` (${listing.priceCut.percent}% off)`
                            : ""
                        } - Great opportunity!`
                      : ""}
              </Text>
            </div>
          )}

          {/* Property Details with Visual Separators */}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  {listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""}
                </Text>
              </div>
            )}
            {listing.bathrooms !== undefined && listing.bathrooms > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "#d1d5db",
                  }}
                />
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
                </Text>
              </div>
            )}
            {listing.sqft !== undefined && listing.sqft > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "#d1d5db",
                  }}
                />
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  {formatSqft(listing.sqft)}
                </Text>
              </div>
            )}
          </div>

          {/* View Details Button */}
          {listing.propertyUrl && (
            <Button
              href={listing.propertyUrl}
              style={{
                backgroundColor: listing.priceCut
                  ? "rgba(220, 38, 38, 1)"
                  : listing.isNewListing
                    ? emailColors.gold.DEFAULT
                    : emailColors.olive.DEFAULT,
                color: "#ffffff",
                textDecoration: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                display: "inline-block",
                fontSize: "15px",
                fontWeight: "600",
                letterSpacing: "0.2px",
                boxShadow: listing.priceCut
                  ? "0 2px 4px rgba(220, 38, 38, 0.3)"
                  : listing.isNewListing
                    ? "0 2px 4px rgba(212, 175, 55, 0.3)"
                    : "0 2px 4px rgba(163, 177, 138, 0.3)",
                transition: "all 0.2s ease",
              }}
            >
              View Full Details →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
