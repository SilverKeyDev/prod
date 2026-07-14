import { Button, Text } from "@react-email/components";

import { emailColors } from "../components/colors";
import { EmailTemplate } from "../components/EmailTemplate";

export type CampaignAgentEmailProps = {
  headline: string;
  intro: string;
  bodyParagraphs?: string[];
  ctaLabel: string;
  ctaUrl?: string;
  categoryLabel?: string;
  /** Absolute logo URL for iframe / email clients. */
  logoUrl?: string;
};

export default function CampaignAgentEmail({
  headline,
  intro,
  bodyParagraphs = [],
  ctaLabel,
  ctaUrl = "#",
  categoryLabel,
  logoUrl,
}: CampaignAgentEmailProps) {
  const subtitle = categoryLabel
    ? `${categoryLabel} · Agent campaign`
    : "Agent campaign from your brokerage";

  return (
    <EmailTemplate title={headline} subtitle={subtitle} footerVariant="agent" logoUrl={logoUrl}>
      <Text
        style={{
          fontSize: "15px",
          color: emailColors["text-primary"],
          margin: "0 0 16px 0",
          lineHeight: "1.6",
        }}
      >
        {intro}
      </Text>
      {bodyParagraphs.map((paragraph, index) => (
        <Text
          key={`p-${index}`}
          style={{
            fontSize: "15px",
            color: emailColors["text-secondary"],
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          {paragraph}
        </Text>
      ))}
      <div style={{ textAlign: "center", marginTop: "8px", marginBottom: "8px" }}>
        <Button
          href={ctaUrl}
          style={{
            backgroundColor: emailColors.primary,
            borderRadius: "8px",
            color: "#ffffff",
            display: "inline-block",
            fontSize: "15px",
            fontWeight: "600",
            padding: "12px 28px",
            textDecoration: "none",
          }}
        >
          {ctaLabel}
        </Button>
      </div>
    </EmailTemplate>
  );
}
