import { useEffect, useState } from "react";

import { renderCampaignAgentEmailHtml } from "packages/email-templates";
import type { SampleEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { getCampaignPreviewLogoUrl } from "packages/features/brokerage/utils/campaigns/campaignPreviewLogoUrl";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";

type CampaignEmailPreviewModalProps = {
  isOpen: boolean;
  email: SampleEmail | null;
  categoryLabel?: string;
  onClose: () => void;
};

export function CampaignEmailPreviewModal({
  isOpen,
  email,
  categoryLabel,
  onClose,
}: CampaignEmailPreviewModalProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    if (!isOpen || !email) {
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
  }, [isOpen, email, categoryLabel]);

  return (
    <BaseModal
      isOpen={isOpen && email !== null}
      onClose={onClose}
      title={email ? `Variant ${email.variant_key}: ${email.subject}` : "Email preview"}
      size="lg"
      showCloseButton
    >
      <Box className="flex flex-col gap-3" data-testid="campaign-email-preview-modal">
        {email ? (
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
                title={`Full preview of variant ${email.variant_key}`}
                srcDoc={html}
                // No allow-same-origin: avoids parent tooling injecting scripts into a
                // sandboxed srcdoc (console: "allow-scripts permission is not set").
                sandbox=""
                className="bg-background-surface block h-[70vh] min-h-96 w-full border-0"
                data-testid={`campaign-email-full-preview-${email.id}`}
              />
            ) : (
              <Box className="flex min-h-96 flex-col justify-center gap-2 px-3 py-4" role="status">
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
        ) : null}
      </Box>
    </BaseModal>
  );
}
