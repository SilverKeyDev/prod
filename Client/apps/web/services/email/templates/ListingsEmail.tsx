import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import React from "react";

export type Listing = {
  id: string;
  address: string;
  price: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  score?: number;
  imageUrl?: string;
  zillowUrl?: string;
};

export type ListingsEmailProps = {
  recipientEmail: string;
  listings: Listing[];
  maxItems?: number;
  logoUrl?: string;
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

export default function ListingsEmail({
  recipientEmail,
  listings,
  maxItems = 10,
  logoUrl = "https://silverkey.com/logo.png",
}: ListingsEmailProps) {
  const displayListings = listings.slice(0, maxItems);
  const recipientName = recipientEmail.split("@")[0];

  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brown: {
                  DEFAULT: "#8C6F5A",
                  light: "#8C6F5A",
                  muted: "hsl(25, 18%, 45%)",
                },
                olive: {
                  DEFAULT: "#A3B18A",
                  light: "#97a77b",
                  muted: "hsl(85, 15%, 55%)",
                },
                gold: {
                  DEFAULT: "#D4AF37",
                  light: "#E5C158",
                  muted: "hsl(43, 74%, 49%)",
                },
                neutral: {
                  50: "hsl(0, 0%, 98%)",
                  100: "hsl(0, 0%, 96%)",
                  200: "hsl(0, 0%, 90%)",
                  300: "hsl(0, 0%, 83%)",
                  400: "hsl(0, 0%, 64%)",
                  500: "hsl(0, 0%, 45%)",
                  600: "hsl(0, 0%, 32%)",
                  700: "hsl(0, 0%, 25%)",
                  800: "hsl(0, 0%, 15%)",
                  900: "hsl(0, 0%, 9%)",
                },
              },
            },
          },
        }}
      >
        <Body
          className="bg-neutral-50 font-sans"
          style={{
            backgroundColor: "#fafafa",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <Container
            className="bg-white max-w-[600px] mx-auto my-0"
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Header Section with Gradient Accent */}
            <Section
              style={{
                backgroundColor: "#ffffff",
                padding: "32px 32px 24px 32px",
                borderBottom: "3px solid #D4AF37",
              }}
            >
              {logoUrl && (
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <Img
                    src={logoUrl}
                    alt="SilverKey Logo"
                    width="180"
                    height="auto"
                    style={{
                      maxWidth: "180px",
                      height: "auto",
                      margin: "0 auto",
                    }}
                  />
                </div>
              )}

              {/* Greeting */}
              <Text
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1f2937",
                  margin: "0 0 8px 0",
                  lineHeight: "1.3",
                  textAlign: "center",
                }}
              >
                New Property Matches
              </Text>
              <Text
                style={{
                  fontSize: "15px",
                  color: "#6b7280",
                  margin: "0 0 0 0",
                  lineHeight: "1.5",
                  textAlign: "center",
                }}
              >
                We found {displayListings.length} property
                {displayListings.length !== 1 ? "ies" : ""} that match your
                preferences
              </Text>
            </Section>

            {/* Listings */}
            <Section style={{ padding: "24px 32px" }}>
              {displayListings.map((listing, index) => (
                <div
                  key={listing.id}
                  style={{
                    marginBottom: index < displayListings.length - 1 ? "32px" : "0",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
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
                        {/* Score Badge - Top Left */}
                        {listing.score !== undefined && (
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
                            border: "1px solid rgba(229, 231, 235, 0.8)",
                            padding: "8px 16px",
                            borderRadius: "24px",
                            fontSize: "16px",
                            fontWeight: "700",
                            color: "#8C6F5A",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                            letterSpacing: "-0.3px",
                          }}
                        >
                          {formatPrice(listing.price)}
                        </div>
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
                        <Text
                          style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#8C6F5A",
                            margin: "0 0 16px 0",
                            lineHeight: "1.3",
                          }}
                        >
                          {formatPrice(listing.price)}
                        </Text>
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
                        {listing.bedrooms !== undefined &&
                          listing.bedrooms > 0 && (
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
                                {listing.bedrooms} bed
                                {listing.bedrooms !== 1 ? "s" : ""}
                              </Text>
                            </div>
                          )}
                        {listing.bathrooms !== undefined &&
                          listing.bathrooms > 0 && (
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
                                {listing.bathrooms} bath
                                {listing.bathrooms !== 1 ? "s" : ""}
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
                      {listing.zillowUrl && (
                        <Button
                          href={listing.zillowUrl}
                          style={{
                            backgroundColor: "#A3B18A",
                            color: "#ffffff",
                            textDecoration: "none",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            display: "inline-block",
                            fontSize: "15px",
                            fontWeight: "600",
                            letterSpacing: "0.2px",
                            boxShadow: "0 2px 4px rgba(163, 177, 138, 0.3)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          View Full Details →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Section>

            {/* Footer Section */}
            <Section
              style={{
                backgroundColor: "#f9fafb",
                padding: "32px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <Text
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1f2937",
                  margin: "0 0 8px 0",
                  textAlign: "center",
                }}
              >
                Thank you for using SilverKey
              </Text>
              <Text
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  margin: "0 0 0 0",
                  lineHeight: "1.6",
                  textAlign: "center",
                }}
              >
                You're receiving this email because you have active home search
                preferences. We'll keep you updated with new matches as they
                become available.
              </Text>
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "24px",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    margin: "0",
                    lineHeight: "1.5",
                  }}
                >
                  © {new Date().getFullYear()} SilverKey. All rights reserved.
                </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
