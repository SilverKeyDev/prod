import type { SampleEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type CampaignSampleEmailCardProps = {
  email: SampleEmail;
};

export function CampaignSampleEmailCard({ email }: CampaignSampleEmailCardProps) {
  return (
    <Box
      className="border-border bg-background flex flex-col gap-2 rounded-lg border p-4"
      data-testid={`campaign-email-${email.id}`}
    >
      <Box className="flex items-start justify-between gap-2">
        <Title size="sm" as="h3">
          Variant {email.variant_key}
          {email.is_winner ? " ★" : ""}
        </Title>
        {email.is_winner ? (
          <BodyText size="xs" className="text-state-success shrink-0 font-semibold">
            Winner
          </BodyText>
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
      <Box className="border-border mt-1 flex flex-wrap gap-3 border-t pt-2 text-xs">
        <BodyText as="span" size="xs">
          Sent {email.funnel.sent}
        </BodyText>
        <BodyText as="span" size="xs">
          Opened {email.funnel.opened}
        </BodyText>
        <BodyText as="span" size="xs">
          Clicked {email.funnel.clicked}
        </BodyText>
        <BodyText as="span" size="xs">
          Attached {email.funnel.attached}
        </BodyText>
      </Box>
    </Box>
  );
}
