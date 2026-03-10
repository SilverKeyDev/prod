import React from "react";

import { Body, Container, Head, Html, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

import { dateNow } from "packages/utils/date";

import { tailwindConfig } from "./colors";

type EmailTemplateProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
};

export function EmailTemplate({ title, subtitle, children, footerContent }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Tailwind config={tailwindConfig}>
        <Body
          className="bg-neutral-50 font-sans"
          style={{
            backgroundColor: "#fafafa",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <Container
            className="mx-auto my-0 max-w-[600px] bg-white"
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
                {title}
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
                {subtitle}
              </Text>
            </Section>

            {/* Content */}
            <Section style={{ padding: "24px 32px" }}>{children}</Section>

            {/* Footer Section */}
            {footerContent || (
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
                  You're receiving this email because you have active home search preferences. We'll
                  keep you updated with new matches as they become available.
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
                    © {dateNow().year()} SilverKey. All rights reserved.
                  </Text>
                </div>
              </Section>
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
