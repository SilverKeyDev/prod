import type { PartnerPlacement } from "packages/features/partners/api/partners";
import { PartnerPlacementList } from "packages/features/partners/components/PartnerPlacementList";
import { usePartnerPlacementPresentation } from "packages/features/partners/hooks/usePartnerPlacementPresentation";
import { usePartnerPlacements } from "packages/features/partners/hooks/usePartnerPlacements";
import { Box } from "packages/ui/components/primitives";
import type { Workspace } from "packages/utils/workspace";

type PartnerRevSharePlacementProps = {
  stepId: string;
  transactionSubjectId?: string | null;
  workspace?: Workspace;
  /** When provided, skips the internal placements query (parent owns fetch). */
  placements?: PartnerPlacement[];
  isLoading?: boolean;
};

export function PartnerRevSharePlacement({
  stepId,
  transactionSubjectId,
  workspace = "buyer",
  placements: placementsProp,
  isLoading: isLoadingProp,
}: PartnerRevSharePlacementProps) {
  const internalQuery = usePartnerPlacements(
    placementsProp != null ? undefined : stepId,
    placementsProp != null ? undefined : (transactionSubjectId ?? undefined),
    workspace
  );

  const placements = placementsProp ?? internalQuery.data ?? [];
  const isLoading = isLoadingProp ?? internalQuery.isLoading;

  const rows = usePartnerPlacementPresentation({
    placements,
    stepId,
    transactionSubjectId,
  });

  if (isLoading || rows.length === 0) {
    return null;
  }

  return (
    <Box className="gap-responsive-sm mb-3 mt-2 flex flex-col">
      <PartnerPlacementList rows={rows} />
    </Box>
  );
}
