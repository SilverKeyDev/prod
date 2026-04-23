import React, { createContext, type ReactNode, useContext, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";

export type ChecklistStepSubmitRegistration = {
  disabled: boolean;
  busy: boolean;
  onSubmit: () => void;
};

type ChecklistStepSubmitContextValue = {
  registration: ChecklistStepSubmitRegistration | null;
  setRegistration: (value: ChecklistStepSubmitRegistration | null) => void;
};

const ChecklistStepSubmitContext = createContext<ChecklistStepSubmitContextValue | null>(null);

export function ChecklistStepSubmitProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<ChecklistStepSubmitRegistration | null>(null);
  const value = useMemo(() => ({ registration, setRegistration }), [registration]);
  return (
    <ChecklistStepSubmitContext.Provider value={value}>
      {children}
    </ChecklistStepSubmitContext.Provider>
  );
}

/** Colocated with provider; used by footer registration and header button. */
// eslint-disable-next-line react-refresh/only-export-components -- context hook paired with Provider
export function useChecklistStepSubmitRegistry(): ChecklistStepSubmitContextValue | null {
  return useContext(ChecklistStepSubmitContext);
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
