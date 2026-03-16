import { apiGet, apiPost, apiPut } from "packages/services/http/compatibility";

export type TaskChecklistItem = {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: { label: string; href?: string };
  order?: number;
  integration_key?: string;
  component_key?: string;
  allow_unordered_check?: boolean;
  suggestedFormIds?: string[];
  optional?: boolean;
  calendar?: {
    hasDates: boolean;
    days: number;
    eventSchedule?: number[];
  };
};

export type TaskChecklistResponse = {
  items: TaskChecklistItem[];
  checkedIds: number[];
  title?: string | null;
  subtitle?: string | null;
  deadline?: string | null;
  date_finished?: string | null;
};

export type TaskChecklistApiResponse = {
  success: boolean;
  data?: TaskChecklistResponse;
  error?: string;
};

export type ChecklistType = "search" | "offer" | "escrow" | "financing" | "closing" | "insurance";

export async function getTaskChecklist(type: ChecklistType): Promise<TaskChecklistResponse> {
  const response = await apiGet<TaskChecklistApiResponse>(`/api/v1/tasks?type=${type}`);
  if (!response.success || !response.data) {
    throw new Error(response.error ?? `Failed to fetch ${type} checklist`);
  }
  return response.data;
}

export async function updateTaskChecklist(
  type: ChecklistType,
  checkedIds: number[]
): Promise<void> {
  const response = await apiPut<TaskChecklistApiResponse>(`/api/v1/tasks?type=${type}`, {
    checkedIds,
  });
  if (!response.success) {
    throw new Error(response.error ?? `Failed to update ${type} checklist`);
  }
}

export type TransactionAddressData = {
  address: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  place_id?: string;
};

export type TransactionAddressResponse = {
  success: boolean;
  data?: TransactionAddressData;
  error?: string;
};

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
