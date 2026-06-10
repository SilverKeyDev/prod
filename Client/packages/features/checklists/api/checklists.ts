import { apiGet, apiPost, apiPut } from "packages/services/http";
import type { components } from "packages/types/api.generated";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

// Re-export types from generated schema
export type TaskChecklistItem = components["schemas"]["TaskChecklistItem"];
export type TaskChecklistResponse = components["schemas"]["TaskChecklistResponse"];
export type TaskChecklistApiResponse = components["schemas"]["TaskChecklistApiResponse"];
export type TaskChecklistProgressSummary = components["schemas"]["TaskChecklistProgressSummary"];
export type TaskChecklistProgressSummaryResponse =
  components["schemas"]["TaskChecklistProgressSummaryResponse"];
export type TaskChecklistSectionProgress = components["schemas"]["TaskChecklistSectionProgress"];
export type ChecklistType = components["schemas"]["ChecklistType"];

/** Returns `transactions.id` for the authenticated buyer, or null when unavailable. */
export async function tryResolveMyTransactionId(): Promise<string | null> {
  try {
    const me = await getMyTransaction();
    return me.transaction?.id ?? null;
  } catch {
    return null;
  }
}

/** Returns `transactions.id` for the authenticated buyer; throws when missing. */
export async function resolveMyTransactionId(): Promise<string> {
  const id = await tryResolveMyTransactionId();
  if (!id) {
    throw new Error("Transaction not found");
  }
  return id;
}

/** Progress summary for a deal id (`transactions.id`; self or agent's client). */
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

/** Checklist for a deal id (`transactions.id`; self or agent's client). */
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
export type TransactionMeData = components["schemas"]["TransactionMeData"];
export type TransactionMeResponse = components["schemas"]["TransactionMeResponse"];
export type TransactionListResponse = components["schemas"]["TransactionListResponse"];
export type CreateTransactionRequest = components["schemas"]["CreateTransactionRequest"];
export type CreateTransactionResponse = components["schemas"]["CreateTransactionResponse"];
export type SetActiveTransactionRequest = components["schemas"]["SetActiveTransactionRequest"];

export async function getMyTransaction(): Promise<TransactionMeData> {
  const response = await apiGet<TransactionMeResponse>("/api/v1/transactions/me");
  if (!response.success || !response.data) {
    throw new Error(resolveApiResultErrorMessage(response, "Failed to fetch transaction"));
  }
  return response.data;
}

/** List deals (`transactions.id` rows). Pilot UI typically uses `getMyTransaction` only. */
export async function listTransactions(buyerId?: string): Promise<Transaction[]> {
  const query = buyerId ? `?buyer_id=${encodeURIComponent(buyerId)}` : "";
  const response = await apiGet<TransactionListResponse>(`/api/v1/transactions${query}`);
  if (!response.success || !response.data) {
    throw new Error(resolveApiResultErrorMessage(response, "Failed to list transactions"));
  }
  return response.data;
}

export async function createTransaction(body?: CreateTransactionRequest): Promise<Transaction> {
  const response = await apiPost<CreateTransactionResponse>("/api/v1/transactions", body ?? {});
  if (!response.success || !response.data) {
    throw new Error(resolveApiResultErrorMessage(response, "Failed to create transaction"));
  }
  return response.data;
}

export async function setActiveTransaction(transactionId: string): Promise<Transaction> {
  const response = await apiPut<{ success: boolean; data?: Transaction }>(
    "/api/v1/transactions/me/active",
    { transaction_id: transactionId }
  );
  if (!response.success || !response.data) {
    throw new Error(resolveApiResultErrorMessage(response, "Failed to set active transaction"));
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
