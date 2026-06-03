import { useLocalization } from "packages/contexts";
import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import { PartnerPlacementList } from "packages/features/partners/components/PartnerPlacementList";
import { usePartnerPlacementPresentation } from "packages/features/partners/hooks/usePartnerPlacementPresentation";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

/**
 * Checklist integration for rev-share partner placements on a transaction step
 * (replaces legacy Move Concierge–only UI; driven by admin partner config).
 */
export default function PartnerTransactionIntegration({
  stepId,
  transactionId,
  placements = [],
  placementsLoading = false,
}: ChecklistIntegrationComponentProps) {
  const { t } = useLocalization();
  const rows = usePartnerPlacementPresentation({
    placements,
    stepId,
    transactionId,
  });

  if (placementsLoading) {
    return null;
  }

  if (rows.length === 0) {
    return (
      <Box className="px-responsive-sm mb-3 mt-3 w-full min-w-0 max-w-none self-center">
        <BodyText size="sm" muted>
          {t("partners.placement.none_for_step")}
        </BodyText>
      </Box>
    );
  }

  return (
    <Box className="px-responsive-sm mb-3 mt-3 w-full min-w-0 max-w-none self-center">
      <PartnerPlacementList rows={rows} className="w-full min-w-0" />
    </Box>
  );
}
