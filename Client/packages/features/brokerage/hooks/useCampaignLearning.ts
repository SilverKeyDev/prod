/**
 * SIL-309 campaign learning loop hooks (DB campaigns from SIL-306 list API).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { campaignAnalyticsApi } from "packages/features/brokerage/api/campaignAnalytics";
import { useBrokerageOrgId } from "packages/features/brokerage/hooks/useBrokerageOrgId";
import type { CampaignLearningResult } from "packages/features/brokerage/types/campaignLearning";

export function useResolvedBrokerageOrgId(): string {
  const fromAuth = useBrokerageOrgId();
  return fromAuth ?? campaignAnalyticsApi.demoBrokerageOrgId;
}

export const campaignListQueryKey = (brokerageOrgId: string) =>
  ["brokerage", "campaigns", brokerageOrgId] as const;

export const campaignResultsQueryKey = (brokerageOrgId: string, campaignId: string) =>
  ["brokerage", "campaign-results", brokerageOrgId, campaignId] as const;

export const campaignLearningQueryKey = (brokerageOrgId: string, campaignId: string) =>
  ["brokerage", "campaign-learning", brokerageOrgId, campaignId] as const;

export function useCampaignList(brokerageOrgId?: string) {
  const resolved = brokerageOrgId ?? campaignAnalyticsApi.demoBrokerageOrgId;
  return useQuery({
    queryKey: campaignListQueryKey(resolved),
    queryFn: () => campaignAnalyticsApi.listCampaigns(resolved),
    retry: false,
  });
}

export function useCampaignResults(campaignId: string, brokerageOrgId?: string) {
  const resolved = brokerageOrgId ?? campaignAnalyticsApi.demoBrokerageOrgId;
  return useQuery({
    queryKey: campaignResultsQueryKey(resolved, campaignId),
    queryFn: () => campaignAnalyticsApi.getResults(campaignId, resolved),
    enabled: Boolean(campaignId),
    retry: false,
  });
}

export function useCampaignLearning(campaignId: string, brokerageOrgId?: string) {
  const resolved = brokerageOrgId ?? campaignAnalyticsApi.demoBrokerageOrgId;
  return useQuery({
    queryKey: campaignLearningQueryKey(resolved, campaignId),
    queryFn: async () => {
      const res = await campaignAnalyticsApi.getLearning(campaignId, resolved);
      if ("learning" in res && res.learning === null) return null;
      return res as CampaignLearningResult;
    },
    enabled: Boolean(campaignId),
    retry: false,
  });
}

export function useRunCampaignLearningLoop(campaignId: string, brokerageOrgId?: string) {
  const resolved = brokerageOrgId ?? campaignAnalyticsApi.demoBrokerageOrgId;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts?: { skipPerplexity?: boolean }) =>
      campaignAnalyticsApi.runLearningLoop(campaignId, {
        brokerageOrgId: resolved,
        skipPerplexity: opts?.skipPerplexity,
      }),
    onSuccess: (data) => {
      // Key cache by response campaign_id so a late response cannot land under
      // a different selector if the user switched campaigns mid-flight.
      const resultCampaignId = data.campaign_id || campaignId;
      void qc.setQueryData(campaignLearningQueryKey(resolved, resultCampaignId), data);
      void qc.invalidateQueries({
        queryKey: campaignResultsQueryKey(resolved, resultCampaignId),
      });
      void qc.invalidateQueries({ queryKey: campaignListQueryKey(resolved) });
    },
  });
}
