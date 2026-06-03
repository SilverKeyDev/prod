import { useLocalization } from "packages/contexts";
import {
  normalizePartnerIntegrationDisplayMode,
  type PartnerIntegrationDisplayMode,
  partnerShowsIframe,
} from "packages/features/partners/types/integrationDisplay";
import { Button, Subtitle } from "packages/ui";
import Card from "packages/ui/components/cards/Card";
import { Box, Image } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

type PartnerIntegrationExperienceProps = {
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  integrationDisplayMode?: PartnerIntegrationDisplayMode | string | null;
  embedSrc?: string | null;
  href?: string;
  onOpen?: () => void;
  ctaLabel?: string;
  iframeTitle?: string;
  /** When embed_only, renders iframe and/or link without the partner summary card (e.g. Move Concierge hero). */
  variant?: "full" | "embed_only";
};

export function PartnerIntegrationExperience({
  name,
  logoUrl,
  description,
  integrationDisplayMode,
  embedSrc,
  href,
  onOpen,
  ctaLabel,
  iframeTitle,
  variant = "full",
}: PartnerIntegrationExperienceProps) {
  const { t } = useLocalization();
  const mode = normalizePartnerIntegrationDisplayMode(integrationDisplayMode);
  const showIframe = partnerShowsIframe(mode) && Boolean(embedSrc?.trim());
  const showLink = Boolean(href || onOpen);
  const label = ctaLabel ?? t("partners.placement.open_partner");
  const iframeLabel = iframeTitle ?? name;

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    if (href) {
      getWindow()?.open?.(href, "_blank", "noopener,noreferrer");
    }
  };

  const openInNewTabButton = showLink ? (
    <Button
      type="button"
      variant="outline"
      size="md"
      onPress={handleOpen}
      className="min-h-11 w-full border-dotted border-neutral-400 sm:w-auto sm:self-start"
    >
      {label}
    </Button>
  ) : null;

  const iframeBlock = showIframe ? (
    <iframe
      src={embedSrc!}
      title={iframeLabel}
      className="border-border min-h-80 w-full rounded-lg border md:min-h-96"
    />
  ) : null;

  if (variant === "embed_only") {
    return (
      <Box className="gap-responsive-sm flex w-full min-w-0 flex-col">
        {openInNewTabButton}
        {iframeBlock}
      </Box>
    );
  }

  return (
    <Box className="gap-responsive-sm flex w-full min-w-0 flex-col">
      <Card border="dotted" padding="md">
        <Box className="gap-responsive-md flex flex-col">
          <Box className="gap-responsive-md flex flex-col sm:flex-row sm:items-start">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                className="border-border-card-muted mx-auto h-16 w-16 flex-shrink-0 rounded-lg border object-contain sm:mx-0 sm:h-20 sm:w-20"
                loading="lazy"
              />
            ) : null}
            <Box className="min-w-0 flex-1 flex-col gap-2 text-center sm:text-left">
              <Subtitle size="sm" className="break-words">
                {name}
              </Subtitle>
              {description ? (
                <Subtitle size="xs" muted className="break-words leading-relaxed">
                  {description}
                </Subtitle>
              ) : null}
            </Box>
          </Box>
          {openInNewTabButton}
        </Box>
      </Card>
      {iframeBlock}
    </Box>
  );
}
