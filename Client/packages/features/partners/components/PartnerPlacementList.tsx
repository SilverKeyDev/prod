import { useLocalization } from "packages/contexts";
import { PartnerIntegrationExperience } from "packages/features/partners/components/PartnerIntegrationExperience";
import type { PartnerPlacementPresentationRow } from "packages/features/partners/hooks/usePartnerPlacementPresentation";
import { Box } from "packages/ui/components/structure/primitives";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

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
    <Box className={twMergeClasses("gap-responsive-sm flex flex-col", className)}>
      {rows.map(({ placement, href, displayMode, embedSrc }) => {
        const partner = placement.partner;
        return (
          <PartnerIntegrationExperience
            key={partner.id}
            name={partner.name}
            logoUrl={partner.logo_url}
            description={partner.description}
            integrationDisplayMode={displayMode}
            embedSrc={embedSrc}
            href={href}
            ctaLabel={t("partners.placement.open_partner")}
            iframeTitle={partner.name}
          />
        );
      })}
    </Box>
  );
}
