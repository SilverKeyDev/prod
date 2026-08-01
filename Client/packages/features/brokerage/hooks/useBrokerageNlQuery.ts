/**
 * SIL-323 natural-language analytics query mutation.
 */
import { useMutation } from "@tanstack/react-query";

import {
  DEMO_BROKERAGE_ORG_ID,
  type NlQueryResponse,
  postBrokerageNlQuery,
} from "packages/features/brokerage/api/nlQuery";
import { useBrokerageOrgId } from "packages/features/brokerage/hooks/useBrokerageOrgId";

export function useBrokerageNlQuery() {
  const fromAuth = useBrokerageOrgId();
  const brokerageOrgId = fromAuth ?? DEMO_BROKERAGE_ORG_ID;
  return useMutation({
    mutationFn: (question: string): Promise<NlQueryResponse> =>
      postBrokerageNlQuery({
        brokerage_org_id: brokerageOrgId,
        question: question.trim(),
      }),
  });
}
