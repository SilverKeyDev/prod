import { useEffect, useState } from "react";

import { renderCampaignAgentEmailHtml } from "packages/email-templates";
import type { SampleEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { isControlEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { getCampaignPreviewLogoUrl } from "packages/features/brokerage/utils/campaigns/campaignPreviewLogoUrl";
import type { VariantSignificance } from "packages/features/brokerage/utils/campaigns/campaignVariantSignificance";
import { Button } from "packages/ui";
import StatusBadge from "packages/ui/components/media/asset/StatusBadge";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

type CampaignSampleEmailCardProps = {
  email: SampleEmail;
  categoryLabel?: string;
  significance?: VariantSignificance | null;
  onOpen?: (email: SampleEmail) => void;
  onEdit?: (email: SampleEmail) => void;
};

type FunnelStage = {
  label: string;
  value: number;
  conversionFromPrior?: string;
};

function rateOf(part: number, whole: number): string | undefined {
  if (whole <= 0) return undefined;
  return `${Math.round((part / whole) * 100)}%`;
}

function MiniFunnel({ stages }: { stages: FunnelStage[] }) {
  return (
    <Box
      className="border-border flex flex-col gap-1.5 border-t pt-2"
      data-testid="campaign-email-mini-funnel"
    >
      <Box className="flex gap-1">
        {stages.map((stage, index) => {
          const max = stages[0]?.value || 1;
          const widthPct = Math.max(12, Math.round((stage.value / max) * 100));
          return (
            <Box key={stage.label} className="flex min-w-0 flex-1 flex-col gap-1">
              <Box
                className="bg-gold/25 h-1.5 rounded-full"
                style={{ width: `${widthPct}%` }}
                aria-hidden
              />
              <BodyText size="xs" muted>
                {stage.label}
              </BodyText>
              <Box className="flex flex-wrap items-baseline gap-1">
                <BodyText size="sm" className="font-semibold tabular-nums">
                  {stage.value}
                </BodyText>
                {stage.conversionFromPrior && index > 0 ? (
                  <BodyText size="xs" muted className="tabular-nums">
                    {stage.conversionFromPrior}
                  </BodyText>
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function CampaignSampleEmailCard({
  email,
  categoryLabel,
  significance,
  onOpen,
  onEdit,
}: CampaignSampleEmailCardProps) {
  const { sent, opened, clicked, attached } = email.funnel;
  const isControl = isControlEmail(email);
  const [html, setHtml] = useState<string | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    if (isControl) {
      setHtml(null);
      setRenderFailed(false);
      return;
    }

    let cancelled = false;
    setRenderFailed(false);
    setHtml(null);

    void renderCampaignAgentEmailHtml({
      headline: email.headline,
      intro: email.intro,
      bodyParagraphs: email.body_paragraphs,
      ctaLabel: email.cta_label,
      ctaUrl: email.booking_link || "#",
      categoryLabel,
      logoUrl: getCampaignPreviewLogoUrl(),
    })
      .then((rendered) => {
        if (!cancelled) setHtml(rendered);
      })
      .catch(() => {
        if (!cancelled) {
          setHtml(null);
          setRenderFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [email, categoryLabel, isControl]);

  const funnelStages: FunnelStage[] = [
    { label: "Sent", value: sent },
    { label: "Opened", value: opened, conversionFromPrior: rateOf(opened, sent) },
    { label: "Clicked", value: clicked, conversionFromPrior: rateOf(clicked, opened) },
    { label: "Attached", value: attached, conversionFromPrior: rateOf(attached, clicked) },
  ];

  return (
    <Box
      className="border-border bg-background flex h-full min-h-[28rem] flex-col gap-3 rounded-lg border p-4 shadow-sm"
      data-testid={`campaign-email-${email.id}`}
    >
      <Box className="flex flex-wrap justify-end gap-2">
        {isControl ? <StatusBadge text="Control" variant="default" size="xs" /> : null}
        {email.is_winner && !isControl ? (
          <StatusBadge
            text="Winner"
            variant="warning"
            size="xs"
            className="!bg-gold-muted !text-gold"
          />
        ) : null}
        {significance ? (
          <Box data-testid={`campaign-email-significance-${email.id}`}>
            <StatusBadge
              text={significance.label}
              variant={significance.status === "significant" ? "success" : "default"}
              size="xs"
            />
          </Box>
        ) : null}
      </Box>

      {isControl ? (
        <Box
          className="border-border bg-background-base flex aspect-[4/3] flex-col justify-center gap-2 rounded-md border px-4 py-4"
          data-testid={`campaign-email-control-panel-${email.id}`}
        >
          <BodyText size="sm" className="font-medium">
            No email sent
          </BodyText>
          <BodyText size="xs" muted>
            {email.intro}
          </BodyText>
          <BodyText size="xs" muted>
            This holdout arm stays on the comparison charts as the untreated baseline.
          </BodyText>
        </Box>
      ) : (
        <Box className="border-border bg-background-base overflow-hidden rounded-md border">
          <Box className="border-border bg-background flex flex-col gap-0.5 border-b px-3 py-2">
            <BodyText size="xs" muted>
              Subject
            </BodyText>
            <BodyText size="sm" className="font-medium">
              {email.subject}
            </BodyText>
          </Box>
          {html ? (
            <iframe
              title={`Preview: ${email.subject}`}
              srcDoc={html}
              // No allow-same-origin: avoids parent tooling injecting scripts into a
              // sandboxed srcdoc (console: "allow-scripts permission is not set").
              sandbox=""
              className="bg-background-surface block aspect-[4/3] h-auto w-full border-0"
              data-testid={`campaign-email-preview-${email.id}`}
            />
          ) : (
            <Box
              className="flex aspect-[4/3] flex-col justify-center gap-2 px-3 py-4"
              role="status"
            >
              {renderFailed ? (
                <>
                  <BodyText size="sm" className="font-medium">
                    {email.subject}
                  </BodyText>
                  <BodyText size="xs" muted>
                    {email.preview_body}
                  </BodyText>
                </>
              ) : (
                <BodyText size="xs" muted>
                  Loading email preview…
                </BodyText>
              )}
            </Box>
          )}
        </Box>
      )}

      {(onOpen || onEdit) && !isControl ? (
        <Box className="flex flex-wrap gap-2">
          {onOpen ? (
            <Box data-testid={`campaign-email-open-${email.id}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                label={`Open variant ${email.variant_key}`}
                onClick={() => onOpen(email)}
              >
                Open
              </Button>
            </Box>
          ) : null}
          {onEdit ? (
            <Box data-testid={`campaign-email-edit-${email.id}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                label={`Edit variant ${email.variant_key}`}
                onClick={() => onEdit(email)}
              >
                Edit
              </Button>
            </Box>
          ) : null}
        </Box>
      ) : null}

      {email.booking_link && !isControl ? (
        <BodyText size="xs" className="text-text-secondary truncate">
          {email.booking_link}
        </BodyText>
      ) : null}

      <Box className="mt-auto" data-testid={`campaign-email-funnel-${email.id}`}>
        <MiniFunnel stages={funnelStages} />
      </Box>
    </Box>
  );
}
