/**
 * SIL-323 natural-language analytics query mutation.
 */
import { useMutation } from "@tanstack/react-query";

import { campaignAnalyticsApi } from "packages/features/brokerage/api/campaignAnalytics";
import {
  type NlQueryResponse,
  postBrokerageNlQuery,
} from "packages/features/brokerage/api/nlQuery";
import { useBrokerageOrgId } from "packages/features/brokerage/hooks/useBrokerageOrgId";

export function useBrokerageNlQuery() {
  const fromAuth = useBrokerageOrgId();
  const brokerageOrgId = fromAuth ?? campaignAnalyticsApi.demoBrokerageOrgId;
  return useMutation({
    mutationFn: (question: string): Promise<NlQueryResponse> =>
      postBrokerageNlQuery({
        brokerage_org_id: brokerageOrgId,
        question: question.trim(),
      }),
  });
}
