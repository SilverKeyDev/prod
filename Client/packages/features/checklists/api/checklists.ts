/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import { apiGet, apiPost, apiPut } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

// Re-export types from generated schema
export type TaskChecklistItem = components["schemas"]["TaskChecklistItem"];
export type TaskChecklistResponse = components["schemas"]["TaskChecklistResponse"];
export type TaskChecklistApiResponse = components["schemas"]["TaskChecklistApiResponse"];
export type ChecklistType = components["schemas"]["ChecklistType"];

export async function getTaskChecklist(type: ChecklistType): Promise<TaskChecklistResponse> {
  const response = await apiGet<TaskChecklistApiResponse>(`/api/v1/tasks?type=${type}`);
  if (!response.success || !response.data) {
    throw new Error(response.error ?? `Failed to fetch ${type} checklist`);
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
    throw new Error(response.error ?? `Failed to fetch ${type} checklist for subject`);
  }
  return response.data;
}

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
    throw new Error(response.error ?? `Failed to update ${type} checklist`);
  }
  return response.data.checkedIds;
}

// Re-export transaction address types from generated schema
export type TransactionAddressData = components["schemas"]["TransactionAddressData"];
export type TransactionAddressResponse = components["schemas"]["TransactionAddressResponse"];

export async function getTransactionAddress(): Promise<TransactionAddressData | null> {
  const response = await apiGet<TransactionAddressResponse>("/api/v1/transactions/address");
  if (!response.success) {
    throw new Error(response.error ?? "Failed to fetch transaction address");
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
    throw new Error(response.error ?? "Failed to save transaction address");
  }
  return response.data;
}
