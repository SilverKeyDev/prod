/**
 * Brokerage NL analytics query API (SIL-323).
 */

import { apiPost } from "packages/services/http/apiMethods";
import type { components } from "packages/types/api.generated";

/** Matches Server `DEFAULT_BROKERAGE_ORG_ID` for demo / unauthenticated fallbacks. */
export const DEMO_BROKERAGE_ORG_ID = "a0000000-0000-4000-8000-000000000001";

export type NlQueryRequest = components["schemas"]["NlQueryRequest"];
export type NlQueryResponse = components["schemas"]["NlQueryResponse"];

export function postBrokerageNlQuery(body: NlQueryRequest) {
  return apiPost<NlQueryResponse>("/api/v1/brokerage/analytics/nl-query", body);
}
