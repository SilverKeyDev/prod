import { useLocalization } from "packages/contexts";
import {
  normalizePartnerIntegrationDisplayMode,
  type PartnerIntegrationDisplayMode,
  partnerShowsIframe,
} from "packages/features/partners/types/integrationDisplay";
import { NavigationButton, Subtitle } from "packages/ui";
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
    <NavigationButton
      onClick={handleOpen}
      size="md"
      className="text-olive hover:text-olive active:text-olive self-start rounded border border-dotted border-neutral-400 px-2 py-1"
    >
      {label}
    </NavigationButton>
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
      <Box className="gap-responsive-sm flex w-full flex-col">
        {openInNewTabButton}
        {iframeBlock}
      </Box>
    );
  }

  return (
    <Box className="gap-responsive-sm flex w-full flex-col">
      <Card border="dotted" padding="md">
        <Box className="gap-responsive-md flex flex-col">
          <Box className="flex flex-row items-start">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                className="border-border-card-muted h-20 w-20 flex-shrink-0 rounded-lg border object-cover"
                loading="lazy"
              />
            ) : null}
            <Box className="min-w-0 flex-1 flex-col gap-2">
              <Subtitle size="sm">{name}</Subtitle>
              {description ? (
                <Subtitle size="xs" muted className="leading-relaxed">
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
