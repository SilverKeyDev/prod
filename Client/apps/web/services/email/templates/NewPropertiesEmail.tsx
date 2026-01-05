import { Section, Text } from "@react-email/components";
import React from "react";
import { EmailTemplate } from "../components/EmailTemplate";
import { Listing, ListingCard } from "../components/ListingCard";

export type NewProperty = Listing;

export type NewPropertiesEmailProps = {
  recipientEmail: string;
  properties: NewProperty[];
  maxItems?: number;
};

export default function NewPropertiesEmail({
  recipientEmail,
  properties,
  maxItems = 10,
}: NewPropertiesEmailProps) {
  const displayProperties = properties.slice(0, maxItems);
  const newListingsCount = displayProperties.filter((p) => p.isNewListing).length;
  const priceCutsCount = displayProperties.filter((p) => p.priceCut).length;

  const getSubtitle = () => {
    const parts: string[] = [];
    if (newListingsCount > 0) {
      parts.push(
        `${newListingsCount} new listing${newListingsCount !== 1 ? "s" : ""}`
      );
    }
    if (priceCutsCount > 0) {
      parts.push(
        `${priceCutsCount} price reduction${priceCutsCount !== 1 ? "s" : ""}`
      );
    }
    if (parts.length === 0) {
      return `We found ${displayProperties.length} update${
        displayProperties.length !== 1 ? "s" : ""
      } on properties you might be interested in`;
    }
    return `We found ${parts.join(" and ")} - don't miss out!`;
  };

  const footerContent = (
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
        preferences. We'll keep you updated with new listings and price changes
        as they become available.
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
  );

  return (
    <EmailTemplate
      title="New Properties & Price Updates"
      subtitle={getSubtitle()}
      footerContent={footerContent}
    >
      {displayProperties.map((property, index) => (
        <ListingCard
          key={property.id}
          listing={property}
          isLast={index === displayProperties.length - 1}
        />
      ))}
    </EmailTemplate>
  );
}
