import { useLocalization } from "packages/contexts";
import { PartnerIntegrationExperience } from "packages/features/partners/components/PartnerIntegrationExperience";
import type { PartnerPlacementPresentationRow } from "packages/features/partners/hooks/usePartnerPlacementPresentation";
import { Box } from "packages/ui/components/primitives";

type PartnerPlacementListProps = {
  rows: PartnerPlacementPresentationRow[];
  className?: string;
};

export function PartnerPlacementList({ rows, className }: PartnerPlacementListProps) {
  const { t } = useLocalization();

  if (rows.length === 0) {
    return null;
  }

  return (
    <Box className={className ?? "gap-responsive-sm flex flex-col"}>
      {rows.map(({ placement, href, displayMode, embedSrc }) => {
        const partner = placement.partner;
        const isMoveConcierge = partner.slug === "move-concierge";
        return (
          <PartnerIntegrationExperience
            key={partner.id}
            name={partner.name}
            logoUrl={partner.logo_url}
            description={partner.description}
            integrationDisplayMode={displayMode}
            embedSrc={embedSrc}
            href={href}
            ctaLabel={
              isMoveConcierge
                ? t("close.home_concierge.open_in_new_tab")
                : t("partners.placement.open_partner")
            }
            iframeTitle={partner.name}
          />
        );
      })}
    </Box>
  );
}
