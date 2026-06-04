import { useMemo } from "react";

import type { PartnerPlacement } from "packages/features/partners/api/partners";
import {
  normalizePartnerIntegrationDisplayMode,
  partnerShowsIframe,
} from "packages/features/partners/types/integrationDisplay";
import { useAuthStore } from "packages/store";
import { buildRevShareRedirectUrl } from "packages/utils/revShare/revShareRedirectUrl";
import { getOrCreateRevShareSessionId } from "packages/utils/revShare/revShareSession";

export type PartnerPlacementPresentationRow = {
  placement: PartnerPlacement;
  href: string;
  displayMode: ReturnType<typeof normalizePartnerIntegrationDisplayMode>;
  embedSrc: string | null;
};

type UsePartnerPlacementPresentationArgs = {
  placements: PartnerPlacement[];
  stepId?: string;
  transactionId?: string | null;
  /** Override redirect origin (e.g. native API base URL). */
  redirectOrigin?: string;
};

function resolveRedirectOrigin(override?: string): string {
  if (override?.trim()) {
    return override.replace(/\/$/, "");
  }
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    const loc = (globalThis as { location?: { origin?: string } }).location;
    if (loc?.origin) {
      return loc.origin;
    }
  }
  return "";
}

/**
 * RESPA: Partner placement presentation — link CTAs route through /r/ for click logging.
 * Embed URLs come from admin-configured placement.embed_src (no partner-slug hardcoding).
 */
export function usePartnerPlacementPresentation({
  placements,
  stepId,
  transactionId,
  redirectOrigin,
}: UsePartnerPlacementPresentationArgs): PartnerPlacementPresentationRow[] {
  const buyerId = useAuthStore((s) => s.user?.id ?? null);

  return useMemo(() => {
    if (!stepId || placements.length === 0) {
      return [];
    }

    const origin = resolveRedirectOrigin(redirectOrigin);
    const sessionId = getOrCreateRevShareSessionId();

    return placements.map((placement) => {
      const partner = placement.partner;
      const displayMode = normalizePartnerIntegrationDisplayMode(partner.integration_display_mode);
      const href = origin
        ? buildRevShareRedirectUrl(origin, {
            linkId: placement.link_id,
            buyerId,
            transactionId: transactionId ?? undefined,
            stepId,
            sessionId,
          })
        : placement.destination_url?.trim() || "";

      const embedSrc =
        partnerShowsIframe(displayMode) && placement.embed_src?.trim()
          ? placement.embed_src.trim()
          : null;

      return { placement, href, displayMode, embedSrc };
    });
  }, [placements, stepId, transactionId, redirectOrigin, buyerId]);
}
