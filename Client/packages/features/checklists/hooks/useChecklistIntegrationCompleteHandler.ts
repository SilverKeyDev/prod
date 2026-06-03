import { useCallback, useRef } from "react";

import { useLocalization } from "packages/contexts";
import { runChecklistIntegrationComplete } from "packages/features/checklists/utils/integration/checklistIntegrationComplete";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";

type UseChecklistIntegrationCompleteHandlerArgs = {
  itemId: number;
  commitToggleItem: (id: number) => void | Promise<void>;
  canMarkChecked: boolean;
};

export function useChecklistIntegrationCompleteHandler({
  itemId,
  commitToggleItem,
  canMarkChecked,
}: UseChecklistIntegrationCompleteHandlerArgs): () => void {
  const { t } = useLocalization();
  const commitToggleItemRef = useRef(commitToggleItem);
  commitToggleItemRef.current = commitToggleItem;
  const canMarkCheckedRef = useRef(canMarkChecked);
  canMarkCheckedRef.current = canMarkChecked;

  return useCallback(() => {
    runChecklistIntegrationComplete({
      canMarkChecked: () => canMarkCheckedRef.current,
      commitToggleItem: (id) => commitToggleItemRef.current(id),
      itemId,
      notifyBlocked: () =>
        showWarningToast(
          t("checklists.step_merge_not_applied", {
            defaultValue:
              "This step could not be marked complete yet. Finish earlier steps or required details, then try again.",
          })
        ),
      notifyError: () =>
        showWarningToast(
          t("checklists.update_error", {
            defaultValue: "Could not update this step. Please try again.",
          })
        ),
    });
  }, [itemId, t]);
}
