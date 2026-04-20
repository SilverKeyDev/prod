import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checklistDispatchAutomationApi,
  type ChecklistDispatchAutomationSetting,
  type UpdateChecklistDispatchAutomationRequest,
} from "packages/features/checklists/api/checklistDispatchAutomation";

const queryKey = (clientUserId: string, section: string, itemId: number) =>
  ["checklist-dispatch-automation", clientUserId, section, itemId] as const;

export function useChecklistDispatchAutomationQuery(
  clientUserId: string | null,
  section: string | null,
  itemId: number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey:
      clientUserId && section != null && itemId != null
        ? queryKey(clientUserId, section, itemId)
        : ["checklist-dispatch-automation", "disabled"],
    queryFn: async () => {
      if (!clientUserId || section == null || itemId == null) {
        throw new Error("Missing dispatch automation query params");
      }
      const res = await checklistDispatchAutomationApi.getSetting(clientUserId, section, itemId);
      if (!res.success || !res.setting) {
        throw new Error(res.error ?? "Failed to load dispatch settings");
      }
      return res.setting;
    },
    enabled: Boolean(enabled && clientUserId && section != null && itemId != null),
    staleTime: 30_000,
  });
}

export function useChecklistDispatchAutomationSave(
  clientUserId: string | null,
  section: string | null,
  itemId: number | null
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateChecklistDispatchAutomationRequest) => {
      if (!clientUserId || section == null || itemId == null) {
        throw new Error("Missing params");
      }
      const res = await checklistDispatchAutomationApi.putSetting(
        clientUserId,
        section,
        itemId,
        body
      );
      if (!res.success || !res.setting) {
        throw new Error(res.error ?? "Failed to save");
      }
      return res.setting;
    },
    onSuccess: (data: ChecklistDispatchAutomationSetting) => {
      if (clientUserId && section != null && itemId != null) {
        qc.setQueryData(queryKey(clientUserId, section, itemId), data);
      }
    },
  });
}
