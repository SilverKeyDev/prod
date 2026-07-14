import React from "react";

import { Body, Container, Head, Html, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

import { dateNow } from "packages/utils/core/date";

import { emailColors, tailwindConfig } from "./colors";
import { Logo } from "./Logo";

export type EmailFooterVariant = "buyer" | "agent" | "custom";

type EmailTemplateProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** When provided, replaces the default footer for `footerVariant="custom"`. */
  footerContent?: React.ReactNode;
  /** Defaults to buyer copy (listings). Use `agent` for brokerage campaigns. */
  footerVariant?: EmailFooterVariant;
  /** Show SilverKey logo above the title. Defaults to true. */
  showLogo?: boolean;
  /** Absolute or relative logo URL passed through to Logo. */
  logoUrl?: string;
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function DefaultFooter({ title, body }: { title: string; body: string }): React.JSX.Element {
  return (
    <Section
      style={{
        backgroundColor: emailColors.neutral["50"] ?? "#f9fafb",
        padding: "32px",
        borderTop: `1px solid ${emailColors.border}`,
      }}
    >
      <Text
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: emailColors["text-primary"],
          margin: "0 0 8px 0",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: "13px",
          color: emailColors["text-secondary"],
          margin: "0 0 0 0",
          lineHeight: "1.6",
          textAlign: "center",
        }}
      >
        {body}
      </Text>
      <div
        style={{
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: `1px solid ${emailColors["border-light"]}`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            fontSize: "12px",
            color: emailColors["text-secondary"],
            margin: "0",
            lineHeight: "1.5",
          }}
        >
          © {dateNow().year()} SilverKey. All rights reserved.
        </Text>
      </div>
    </Section>
  );
}

export function EmailTemplate({
  title,
  subtitle,
  children,
  footerContent,
  footerVariant = "buyer",
  showLogo = true,
  logoUrl,
}: EmailTemplateProps) {
  const resolvedFooter =
    footerContent ??
    (footerVariant === "agent" ? (
      <DefaultFooter
        title="SilverKey for your brokerage"
        body="You're receiving this because your brokerage runs agent campaigns in SilverKey. Reply to your ops lead if you have questions."
      />
    ) : (
      <DefaultFooter
        title="Thank you for using SilverKey"
        body="You're receiving this email because you have active home search preferences. We'll keep you updated with new matches as they become available."
      />
    ));

  return (
    <Html>
      <Head />
      <Tailwind config={tailwindConfig}>
        <Body
          className="font-sans"
          style={{
            backgroundColor: emailColors.neutral["50"] ?? "#fafafa",
            fontFamily: FONT_STACK,
          }}
        >
          <Container
            className="mx-auto my-0 max-w-[600px]"
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: emailColors["background-surface"],
            }}
          >
            <Section
              style={{
                backgroundColor: emailColors["background-surface"],
                padding: "32px 32px 24px 32px",
                borderBottom: `3px solid ${emailColors.primary}`,
              }}
            >
              {showLogo ? <Logo logoUrl={logoUrl} /> : null}
              <Text
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: emailColors["text-primary"],
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
                  color: emailColors["text-secondary"],
                  margin: "0",
                  lineHeight: "1.5",
                  textAlign: "center",
                }}
              >
                {subtitle}
              </Text>
            </Section>

            <Section style={{ padding: "24px 32px" }}>{children}</Section>

            {resolvedFooter}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default EmailTemplate;
