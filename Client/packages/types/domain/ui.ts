/**
 * UI and client-composed shapes that are not part of the HTTP OpenAPI contract.
 * For API types, use `packages/types/api.generated` (or feature API shims that re-export it).
 */

import type { AlertSeverity } from "packages/schemas/agent";

/** Result of sharing a report via Web Share API or clipboard (constructed in the client). */
export type ShareDocumentResult = {
  success: boolean;
  message: string;
};

/** Mock / dashboard alert row (not backed by a dedicated API schema yet). */
export type UrgentAlert = {
  id: string;
  type: string;
  message: string;
  client_id: string;
  deadline: string;
  severity: AlertSeverity;
  created_at: string;
};
