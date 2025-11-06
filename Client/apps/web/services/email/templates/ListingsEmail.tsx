import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Img,
  Row,
  Column,
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
}: ListingsEmailProps) {
  const displayListings = listings.slice(0, maxItems);

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
        <Body className="bg-neutral-100 font-sans">
          <Container className="bg-white max-w-[600px] mx-auto my-8 p-8 rounded-lg shadow-sm">
            {/* Header */}
            <Section className="mb-6">
              <Heading className="text-2xl font-bold text-black mb-2">
                New Properties Matching Your Preferences
              </Heading>
              <Text className="text-base text-neutral-600 mb-4">
                Hello!
              </Text>
              <Text className="text-base text-neutral-700 mb-6">
                We've found some great properties that match your preferences:
              </Text>
            </Section>

            {/* Listings */}
            {displayListings.map((listing, index) => (
              <Section key={listing.id} className="mb-6">
                <div
                  className="border border-neutral-200 rounded-lg overflow-hidden bg-white"
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  {/* Property Image */}
                  {listing.imageUrl && (
                    <div
                      className="relative w-full"
                      style={{
                        height: "200px",
                        backgroundColor: "#f3f4f6",
                        overflow: "hidden",
                      }}
                    >
                      <Img
                        src={listing.imageUrl}
                        alt={listing.address}
                        width="600"
                        height="200"
                        className="w-full h-full object-cover"
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                        }}
                      />
                      {/* Price Badge */}
                      <div
                        className="absolute top-3 right-3 rounded-full px-3 py-1.5"
                        style={{
                          backgroundColor: "rgba(250, 250, 250, 0.95)",
                          border: "1px solid rgba(229, 231, 235, 0.5)",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        <Text
                          className="text-sm font-medium m-0"
                          style={{ color: "#8C6F5A", margin: 0 }}
                        >
                          {formatPrice(listing.price)}
                        </Text>
                      </div>
                      {/* Score Badge */}
                      {listing.score !== undefined && (
                        <div
                          className="absolute top-3 left-3 rounded-full px-2 py-1"
                          style={{
                            backgroundColor: "rgba(139, 111, 90, 0.9)",
                            color: "white",
                          }}
                        >
                          <Text
                            className="text-xs font-medium m-0"
                            style={{ margin: 0 }}
                          >
                            {Math.round(listing.score)}% Match
                          </Text>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Property Content */}
                  <div className="p-4">
                    {/* Address */}
                    <Text
                      className="text-base font-semibold text-black mb-2 m-0"
                      style={{ margin: 0, marginBottom: "8px" }}
                    >
                      {listing.address}
                    </Text>

                    {/* Price (if no image) */}
                    {!listing.imageUrl && (
                      <Text
                        className="text-lg font-bold text-brown mb-2 m-0"
                        style={{
                          color: "#8C6F5A",
                          margin: 0,
                          marginBottom: "8px",
                        }}
                      >
                        {formatPrice(listing.price)}
                      </Text>
                    )}

                    {/* Property Details */}
                    <div
                      className="flex items-center gap-4 text-sm text-neutral-500 mb-3"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        color: "#6b7280",
                        marginBottom: "12px",
                      }}
                    >
                      {listing.bedrooms !== undefined &&
                        listing.bedrooms > 0 && (
                          <Text className="m-0" style={{ margin: 0 }}>
                            {listing.bedrooms} bed
                            {listing.bedrooms !== 1 ? "s" : ""}
                          </Text>
                        )}
                      {listing.bathrooms !== undefined &&
                        listing.bathrooms > 0 && (
                          <Text className="m-0" style={{ margin: 0 }}>
                            {listing.bathrooms} bath
                            {listing.bathrooms !== 1 ? "s" : ""}
                          </Text>
                        )}
                      {listing.sqft !== undefined && listing.sqft > 0 && (
                        <Text className="m-0" style={{ margin: 0 }}>
                          {formatSqft(listing.sqft)}
                        </Text>
                      )}
                    </div>

                    {/* View Details Button */}
                    {listing.zillowUrl && (
                      <Button
                        href={listing.zillowUrl}
                        className="bg-brown text-white no-underline px-4 py-2 rounded-md inline-block text-sm font-medium"
                        style={{
                          backgroundColor: "#8C6F5A",
                          color: "white",
                          textDecoration: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          display: "inline-block",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </Section>
            ))}

            <Hr className="border-neutral-200 my-6" />

            {/* Footer */}
            <Section className="mt-6">
              <Text className="text-base text-neutral-700 mb-2">
                Thank you for using SilverKey!
              </Text>
              <Text className="text-sm text-neutral-500">
                You're receiving this email because you have active home search
                preferences.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
