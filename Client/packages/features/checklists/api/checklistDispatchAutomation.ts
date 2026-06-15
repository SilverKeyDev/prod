/**
 * Agent-only: checklist step dispatch automation settings.
 */

import { log } from "packages/logger";
import { apiGet, apiPut } from "packages/services/http";
import type { components } from "packages/types/api.generated";

export type ChecklistDispatchAutomationApiResponse =
  components["schemas"]["ChecklistDispatchAutomationApiResponse"];
export type ChecklistDispatchAutomationSetting =
  components["schemas"]["ChecklistDispatchAutomationSetting"];
export type UpdateChecklistDispatchAutomationRequest =
  components["schemas"]["UpdateChecklistDispatchAutomationRequest"];
export type AgentClientsResponse = components["schemas"]["AgentClientsResponse"];

export const checklistDispatchAutomationApi = {
  getAgentClients: (): Promise<AgentClientsResponse> => {
    log.debug("API", "getAgentClients for dispatch UI");
    return apiGet<AgentClientsResponse>("/api/v1/agent/clients");
  },

  getSetting: (
    clientUserId: string,
    section: string,
    itemId: number
  ): Promise<ChecklistDispatchAutomationApiResponse> => {
    log.debug("API", "getChecklistDispatchAutomation", {
      clientUserId,
      section,
      itemId,
    });
    return apiGet<ChecklistDispatchAutomationApiResponse>(
      `/api/v1/transactions/${encodeURIComponent(clientUserId)}/checklist-items/${encodeURIComponent(section)}/${itemId}/dispatch-automation`
    );
  },

  putSetting: (
    clientUserId: string,
    section: string,
    itemId: number,
    body: UpdateChecklistDispatchAutomationRequest
  ): Promise<ChecklistDispatchAutomationApiResponse> => {
    log.debug("API", "putChecklistDispatchAutomation", {
      clientUserId,
      section,
      itemId,
    });
    return apiPut<ChecklistDispatchAutomationApiResponse>(
      `/api/v1/transactions/${encodeURIComponent(clientUserId)}/checklist-items/${encodeURIComponent(section)}/${itemId}/dispatch-automation`,
      body
    );
  },
};
