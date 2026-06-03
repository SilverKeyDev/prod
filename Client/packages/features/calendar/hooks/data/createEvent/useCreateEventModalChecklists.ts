import { useMemo } from "react";

import { useQueries } from "@tanstack/react-query";

import { getTaskChecklistForSubject } from "packages/features/checklists/api/checklists";

import { getCalendarEventKindOptionSlice } from "@/features/calendar/utils/createEventModal/calendarEventKindOptions";

type UseCreateEventModalChecklistsArgs = {
  isOpen: boolean;
  mode: "create" | "edit";
  isAgent: boolean;
  authUserId: string | null;
  selectedClientId: string | null;
};

export function useCreateEventModalChecklists({
  isOpen,
  mode,
  isAgent,
  authUserId,
  selectedClientId,
}: UseCreateEventModalChecklistsArgs) {
  const checklistSubjectId = useMemo(() => {
    if (!isOpen || mode !== "create") {
      return null;
    }
    if (!isAgent) {
      return authUserId;
    }
    return selectedClientId;
  }, [isOpen, mode, isAgent, authUserId, selectedClientId]);

  const [searchChecklistQuery, offerChecklistQuery] = useQueries({
    queries: [
      {
        queryKey: ["transactionTasks", checklistSubjectId, "search"] as const,
        queryFn: () => getTaskChecklistForSubject(checklistSubjectId as string, "search"),
        enabled: Boolean(checklistSubjectId) && isOpen && mode === "create",
      },
      {
        queryKey: ["transactionTasks", checklistSubjectId, "offer"] as const,
        queryFn: () => getTaskChecklistForSubject(checklistSubjectId as string, "offer"),
        enabled: Boolean(checklistSubjectId) && isOpen && mode === "create",
      },
    ],
  });

  const checklistProgressLoading =
    Boolean(checklistSubjectId) &&
    (searchChecklistQuery.isLoading || offerChecklistQuery.isLoading);

  const kindOptionSlice = useMemo(
    () =>
      getCalendarEventKindOptionSlice({
        searchCheckedIds: checklistSubjectId ? searchChecklistQuery.data?.checkedIds : undefined,
        offerCheckedIds: checklistSubjectId ? offerChecklistQuery.data?.checkedIds : undefined,
      }),
    [
      checklistSubjectId,
      searchChecklistQuery.data?.checkedIds,
      offerChecklistQuery.data?.checkedIds,
    ]
  );

  return {
    checklistSubjectId,
    checklistProgressLoading,
    kindOptionSlice,
    searchChecklistQuery,
    offerChecklistQuery,
  };
}
