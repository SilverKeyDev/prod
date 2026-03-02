import { apiGet, apiPut } from "packages/services/http/compatibility";

export type TaskChecklistItem = {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: { label: string; href?: string };
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

export type ChecklistType = "escrow" | "financing" | "closing" | "insurance";

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
