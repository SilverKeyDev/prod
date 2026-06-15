import React, { type ReactNode, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  ChecklistStepSubmitContext,
  type ChecklistStepSubmitRegistration,
  useChecklistStepSubmitRegistry,
} from "packages/features/checklists/hooks/useChecklistStepSubmitRegistry";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

export function ChecklistStepSubmitProvider({
  children,
  markCompleteEligible = true,
}: {
  children: ReactNode;
  /** False when the step cannot be marked complete yet (`selectable_when` gates). */
  markCompleteEligible?: boolean;
}) {
  const [registration, setRegistration] = useState<ChecklistStepSubmitRegistration | null>(null);
  const value = useMemo(
    () => ({ registration, setRegistration, markCompleteEligible }),
    [registration, markCompleteEligible]
  );
  return (
    <ChecklistStepSubmitContext.Provider value={value}>
      {children}
    </ChecklistStepSubmitContext.Provider>
  );
}

/**
 * Renders the registered step submit action in the checklist item header, beside expand/collapse.
 */
export function ChecklistStepHeaderSubmitButton({
  integrationVisible,
}: {
  integrationVisible: boolean;
}) {
  const ctx = useChecklistStepSubmitRegistry();
  const { t } = useLocalization();
  const reg = ctx?.registration;
  if (!integrationVisible || !reg) return null;

  const submitLabel = t("checklists.step.submit", { defaultValue: "Submit" });

  return (
    <Box
      className="flex flex-shrink-0 items-center"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && e.stopPropagation()}
    >
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={reg.disabled || reg.busy}
        loading={reg.busy}
        onPress={() => reg.onSubmit()}
        iconName="check"
        label={submitLabel}
      >
        {submitLabel}
      </Button>
    </Box>
  );
}
