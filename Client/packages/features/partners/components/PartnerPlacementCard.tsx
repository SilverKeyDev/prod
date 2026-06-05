import { useLocalization } from "packages/contexts";
import { NavigationButton, Subtitle } from "packages/ui";
import { Box, Image } from "packages/ui/components/structure/primitives";
import Card from "packages/ui/components/surfaces/cards/Card";
import { getWindow } from "packages/utils/core/platform";

type PartnerPlacementCardProps = {
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  href?: string;
  onOpen?: () => void;
  ctaLabel?: string;
};

export function PartnerPlacementCard({
  name,
  logoUrl,
  description,
  href,
  onOpen,
  ctaLabel,
}: PartnerPlacementCardProps) {
  const { t } = useLocalization();
  const label = ctaLabel ?? t("partners.placement.open_partner");

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    if (href) {
      getWindow()?.open?.(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card border="dotted" padding="md">
      <Box className="gap-responsive-md flex flex-row items-start">
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
          {(href || onOpen) && (
            <NavigationButton
              onClick={handleOpen}
              size="md"
              className="text-olive self-start rounded border border-dotted border-neutral-400 px-2 py-1"
            >
              {label}
            </NavigationButton>
          )}
        </Box>
      </Box>
    </Card>
  );
}
