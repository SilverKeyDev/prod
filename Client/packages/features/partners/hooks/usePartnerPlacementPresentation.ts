import { useMemo } from "react";

import type { PartnerPlacement } from "packages/features/partners/api/partners";
import { useMoveConciergeEmbedUrl } from "packages/features/partners/hooks/useMoveConciergeEmbedUrl";
import {
  normalizePartnerIntegrationDisplayMode,
  partnerShowsIframe,
} from "packages/features/partners/types/integrationDisplay";
import { interpolateDestinationUrl } from "packages/utils/revShare/interpolateDestinationUrl";

export type PartnerPlacementPresentationRow = {
  placement: PartnerPlacement;
  href: string;
  displayMode: ReturnType<typeof normalizePartnerIntegrationDisplayMode>;
  embedSrc: string | null;
};

type UsePartnerPlacementPresentationArgs = {
  placements: PartnerPlacement[];
  stepId?: string;
  transactionSubjectId?: string | null;
  /** Override redirect origin (e.g. native API base URL). */
  redirectOrigin?: string;
};

/**
 * RESPA: Partner placement presentation — opens resolved partner destination URLs directly.
 */
export function usePartnerPlacementPresentation({
  placements,
  stepId,
  transactionSubjectId,
}: UsePartnerPlacementPresentationArgs): PartnerPlacementPresentationRow[] {
  const moveConciergeEmbedUrl = useMoveConciergeEmbedUrl();

  return useMemo(() => {
    if (!stepId || placements.length === 0) {
      return [];
    }

    return placements.map((placement) => {
      const partner = placement.partner;
      const displayMode = normalizePartnerIntegrationDisplayMode(partner.integration_display_mode);
      const href =
        placement.destination_url?.trim() ||
        interpolateDestinationUrl(partner.destination_url_template, {
          linkId: placement.link_id,
          partnerSlug: partner.slug,
          transactionId: transactionSubjectId ?? undefined,
        });

      let embedSrc: string | null =
        partnerShowsIframe(displayMode) && placement.embed_src?.trim()
          ? placement.embed_src.trim()
          : null;

      if (!embedSrc && partnerShowsIframe(displayMode) && partner.slug === "move-concierge") {
        embedSrc = moveConciergeEmbedUrl;
      }

      return { placement, href, displayMode, embedSrc };
    });
  }, [placements, stepId, transactionSubjectId, moveConciergeEmbedUrl]);
}
