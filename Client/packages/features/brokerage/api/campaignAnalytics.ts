/**
 * Brokerage campaign learning API — SIL-309 (on top of SIL-306 campaigns).
 */
import type {
  CampaignLearningResult,
  CampaignResultsPayload,
  CampaignSummary,
} from "packages/features/brokerage/types/campaignLearning";
import { apiGet, apiPost } from "packages/services/http/apiMethods";

const DEMO_BROKERAGE_ORG_ID = "a0000000-0000-4000-8000-000000000001";

function qs(brokerageOrgId: string): string {
  return `brokerage_org_id=${encodeURIComponent(brokerageOrgId)}`;
}

export const campaignAnalyticsApi = {
  demoBrokerageOrgId: DEMO_BROKERAGE_ORG_ID,

  listCampaigns(brokerageOrgId: string = DEMO_BROKERAGE_ORG_ID) {
    return apiGet<{ success: boolean; campaigns: CampaignSummary[] }>(
      `/api/v1/brokerage/analytics/campaigns?${qs(brokerageOrgId)}`
    );
  },

  getResults(campaignId: string, brokerageOrgId: string = DEMO_BROKERAGE_ORG_ID) {
    return apiGet<CampaignResultsPayload>(
      `/api/v1/brokerage/analytics/campaigns/${encodeURIComponent(campaignId)}/results?${qs(brokerageOrgId)}`
    );
  },

  getLearning(campaignId: string, brokerageOrgId: string = DEMO_BROKERAGE_ORG_ID) {
    return apiGet<CampaignLearningResult | { success: boolean; learning: null }>(
      `/api/v1/brokerage/analytics/campaigns/${encodeURIComponent(campaignId)}/learning?${qs(brokerageOrgId)}`
    );
  },

  runLearningLoop(
    campaignId: string,
    options: { brokerageOrgId?: string; skipPerplexity?: boolean } = {}
  ) {
    const brokerageOrgId = options.brokerageOrgId ?? DEMO_BROKERAGE_ORG_ID;
    return apiPost<CampaignLearningResult>(
      `/api/v1/brokerage/analytics/campaigns/${encodeURIComponent(campaignId)}/learning-loop?${qs(brokerageOrgId)}`,
      { skip_perplexity: Boolean(options.skipPerplexity) }
    );
  },
};
