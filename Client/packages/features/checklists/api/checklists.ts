import { apiGet, apiPost, apiPut } from "packages/services/http";
import type { components } from "packages/types/api.generated";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";

// Re-export types from generated schema
export type TaskChecklistItem = components["schemas"]["TaskChecklistItem"];
export type TaskChecklistResponse = components["schemas"]["TaskChecklistResponse"];
export type TaskChecklistApiResponse = components["schemas"]["TaskChecklistApiResponse"];
export type TaskChecklistProgressSummary = components["schemas"]["TaskChecklistProgressSummary"];
export type TaskChecklistProgressSummaryResponse =
  components["schemas"]["TaskChecklistProgressSummaryResponse"];
export type TaskChecklistSectionProgress = components["schemas"]["TaskChecklistSectionProgress"];
export type ChecklistType = components["schemas"]["ChecklistType"];

/** @deprecated Prefer `getTaskChecklistForSubject` with a transaction id. Tier D gate: PostHog ~0 on `/api/v1/tasks`. */
export async function getTaskChecklist(type: ChecklistType): Promise<TaskChecklistResponse> {
  const response = await apiGet<TaskChecklistApiResponse>(`/api/v1/tasks?type=${type}`);
  if (!response.success || !response.data) {
    throw new Error(resolveApiResultErrorMessage(response, `Failed to fetch ${type} checklist`));
  }
  return response.data;
}

/** @deprecated Prefer `getTaskChecklistProgressSummaryForSubject`. */
export async function getTaskChecklistProgressSummary(): Promise<TaskChecklistProgressSummary> {
  const response = await apiGet<TaskChecklistProgressSummaryResponse>(
    "/api/v1/tasks/progress-summary"
  );
  if (!response.success || !response.data) {
    throw new Error(
      resolveApiResultErrorMessage(response, "Failed to fetch checklist progress summary")
    );
  }
  return response.data;
}

/** Progress summary for a buyer user id (self or agent's client). */
export async function getTaskChecklistProgressSummaryForSubject(
  transactionId: string
): Promise<TaskChecklistProgressSummary> {
  const response = await apiGet<TaskChecklistProgressSummaryResponse>(
    `/api/v1/transactions/${encodeURIComponent(transactionId)}/tasks/progress-summary`
  );
  if (!response.success || !response.data) {
    throw new Error(
      resolveApiResultErrorMessage(
        response,
        "Failed to fetch checklist progress summary for subject"
      )
    );
  }
  return response.data;
}

/** Checklist for a buyer user id (self or agent's client). */
export async function getTaskChecklistForSubject(
  transactionId: string,
  type: ChecklistType
): Promise<TaskChecklistResponse> {
  const response = await apiGet<TaskChecklistApiResponse>(
    `/api/v1/transactions/${encodeURIComponent(transactionId)}/tasks?type=${type}`
  );
  if (!response.success || !response.data) {
    throw new Error(
      resolveApiResultErrorMessage(response, `Failed to fetch ${type} checklist for subject`)
    );
  }
  return response.data;
}

/** @deprecated Prefer `updateTaskChecklistForSubject`. */
export async function updateTaskChecklist(
  type: ChecklistType,
  checkedIds: number[]
): Promise<number[]> {
  const response = await apiPut<TaskChecklistApiResponse>(`/api/v1/tasks?type=${type}`, {
    data: {
      items: [],
      checkedIds,
    },
  });
  if (!response.success || !response.data) {
    throw new Error(resolveApiResultErrorMessage(response, `Failed to update ${type} checklist`));
  }
  return response.data.checkedIds;
}

/** PUT checklist progress for a buyer subject (self or agent-managed client). */
export async function updateTaskChecklistForSubject(
  transactionId: string,
  type: ChecklistType,
  checkedIds: number[]
): Promise<number[]> {
  const response = await apiPut<TaskChecklistApiResponse>(
    `/api/v1/transactions/${encodeURIComponent(transactionId)}/tasks?type=${type}`,
    {
      data: {
        items: [],
        checkedIds,
      },
    }
  );
  if (!response.success || !response.data) {
    throw new Error(
      resolveApiResultErrorMessage(response, `Failed to update ${type} checklist for subject`)
    );
  }
  return response.data.checkedIds;
}

// Re-export transaction address types from generated schema
export type TransactionAddressData = components["schemas"]["TransactionAddressData"];
export type TransactionAddressResponse = components["schemas"]["TransactionAddressResponse"];
export type Transaction = components["schemas"]["Transaction"];
export type TransactionMeResponse = components["schemas"]["TransactionMeResponse"];

export async function getMyTransaction(): Promise<Transaction> {
  const response = await apiGet<TransactionMeResponse>("/api/v1/transactions/me");
  if (!response.success || !response.data) {
    throw new Error(resolveApiResultErrorMessage(response, "Failed to fetch transaction"));
  }
  return response.data;
}

export async function getTransactionAddress(): Promise<TransactionAddressData | null> {
  const response = await apiGet<TransactionAddressResponse>("/api/v1/transactions/address");
  if (!response.success) {
    throw new Error(resolveApiResultErrorMessage(response, "Failed to fetch transaction address"));
  }
  const data = response.data;
  if (!data || data.address == null) {
    return null;
  }
  return data as TransactionAddressData;
}

export async function saveTransactionAddress(
  data: TransactionAddressData
): Promise<TransactionAddressData> {
  const response = await apiPost<TransactionAddressResponse>("/api/v1/transactions/address", data);
  if (!response.success || !response.data) {
    throw new Error(resolveApiResultErrorMessage(response, "Failed to save transaction address"));
  }
  return response.data;
}
