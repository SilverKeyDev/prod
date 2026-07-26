/**
 * Brokerage NL analytics query API (SIL-323).
 */

import { apiPost } from "packages/services/http/apiMethods";
import type { components } from "packages/types/api.generated";

export type NlQueryRequest = components["schemas"]["NlQueryRequest"];
export type NlQueryResponse = components["schemas"]["NlQueryResponse"];

export function postBrokerageNlQuery(body: NlQueryRequest) {
  return apiPost<NlQueryResponse>("/api/v1/brokerage/analytics/nl-query", body);
}
