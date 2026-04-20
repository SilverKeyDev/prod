import { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { buildHighlightsSubtitle } from "packages/features/propertyDetails/utils/buildHighlightsSubtitle";
import { useIsAgent } from "packages/hooks/store";
import { useAgentDashboardStore } from "packages/store";
import type { PropertyWithAnalysis } from "packages/types/domain/property-analysis";
import {
  normalizeConEntry,
  normalizeProEntry,
} from "packages/utils/search/normalize/normalizeProsConsItems";
import { getPropertyMatchScore } from "packages/utils/search/scoring/propertyMatchScore";

export const useProsAndConsData = (property: unknown) => {
  const { t } = useLocalization();
  const isAgent = useIsAgent();
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);

  const contextLine = useMemo(() => {
    if (!isAgent) return null;
    if (selectedClientId) {
      return t("property_details.pros_cons_context_client", {
        defaultValue: "Based on your selected client's saved search preferences.",
      });
    }
    return t("property_details.pros_cons_context_agent_self", {
      defaultValue:
        "Professional due-diligence framing using your own profile (not a buyer fit score).",
    });
  }, [isAgent, selectedClientId, t]);

  const propertyWithAnalysis = property as PropertyWithAnalysis;
  const propertyAnalysis = propertyWithAnalysis.property_analysis;
  const highlightsContext = propertyAnalysis?.highlights_context;

  const prosList = useMemo(() => {
    const raw = propertyAnalysis?.pros ?? [];
    return raw.map(normalizeProEntry).filter((p) => p.text.length > 0);
  }, [propertyAnalysis]);

  const consList = useMemo(() => {
    const raw = propertyAnalysis?.cons ?? [];
    return raw.map(normalizeConEntry).filter((c) => c.text.length > 0);
  }, [propertyAnalysis]);

  const highlightsSubtitle = useMemo(() => {
    if (!propertyAnalysis) {
      return "";
    }
    if (isAgent && !selectedClientId) {
      return t("property_details.highlights_subtitle_agent_dd", {
        defaultValue: "Strengths and tradeoffs highlight risks and opportunities for this listing.",
      });
    }
    return buildHighlightsSubtitle(t, {
      prosCount: prosList.length,
      consCount: consList.length,
      highlightsContext,
      propertyMatchScore: getPropertyMatchScore(property as { _score?: number | null }),
    });
  }, [
    highlightsContext,
    isAgent,
    property,
    propertyAnalysis,
    prosList.length,
    consList.length,
    selectedClientId,
    t,
  ]);

  return {
    contextLine,
    prosList,
    consList,
    highlightsSubtitle,
    propertyAnalysis,
    isAgent,
    t,
  };
};
