import type { SampleEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import StatusBadge from "packages/ui/components/media/asset/StatusBadge";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type CampaignSampleEmailCardProps = {
  email: SampleEmail;
};

type FunnelStatProps = {
  label: string;
  value: number;
  rate?: string;
};

function rateOf(part: number, whole: number): string | undefined {
  if (whole <= 0) return undefined;
  return `${Math.round((part / whole) * 100)}%`;
}

function FunnelStat({ label, value, rate }: FunnelStatProps) {
  return (
    <Box className="min-w-0 flex-1">
      <BodyText size="xs" muted>
        {label}
      </BodyText>
      <Box className="flex items-baseline gap-1">
        <BodyText size="sm" className="font-semibold tabular-nums">
          {value}
        </BodyText>
        {rate ? (
          <BodyText size="xs" muted className="tabular-nums">
            {rate}
          </BodyText>
        ) : null}
      </Box>
    </Box>
  );
}

export function CampaignSampleEmailCard({ email }: CampaignSampleEmailCardProps) {
  const { sent, opened, clicked, attached } = email.funnel;

  return (
    <Box
      className="border-border bg-background flex flex-col gap-3 rounded-lg border p-4 shadow-sm"
      data-testid={`campaign-email-${email.id}`}
    >
      <Box className="flex items-start justify-between gap-2">
        <Title size="sm" as="h3">
          Variant {email.variant_key}
        </Title>
        {email.is_winner ? (
          <StatusBadge
            text="Winner"
            variant="warning"
            size="xs"
            className="!bg-gold-muted !text-gold"
          />
        ) : null}
      </Box>
      <BodyText size="sm" className="font-medium">
        {email.subject}
      </BodyText>
      <BodyText size="xs" muted>
        {email.preview_body}
      </BodyText>
      {email.booking_link ? (
        <BodyText size="xs" className="text-text-secondary truncate">
          {email.booking_link}
        </BodyText>
      ) : null}
      <Box
        className="border-border flex gap-3 border-t pt-2"
        data-testid={`campaign-email-funnel-${email.id}`}
      >
        <FunnelStat label="Sent" value={sent} />
        <FunnelStat label="Opened" value={opened} rate={rateOf(opened, sent)} />
        <FunnelStat label="Clicked" value={clicked} rate={rateOf(clicked, sent)} />
        <FunnelStat label="Attached" value={attached} rate={rateOf(attached, sent)} />
      </Box>
    </Box>
  );
}
