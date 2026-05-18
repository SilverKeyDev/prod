import { useEffect, useRef } from "react";

import { useLocalization } from "packages/contexts";
import { useOptionalChecklistUpdatePending } from "packages/features/checklists/hooks/useOptionalChecklistUpdatePending";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/primitives";

import { useChecklistStepSubmitRegistry } from "./ChecklistStepSubmitContext";

export type ChecklistStepSubmitBarProps = {
  disabled: boolean;
  onSubmit: () => void;
  busy?: boolean;
};

function ChecklistStepSubmitButton({
  disabled,
  onSubmit,
  busy = false,
}: ChecklistStepSubmitBarProps) {
  const { t } = useLocalization();
  const submitLabel = t("checklists.step.submit", { defaultValue: "Submit" });
  return (
    <Button
      type="button"
      variant="primary"
      size="md"
      disabled={disabled || busy}
      loading={busy}
      onPress={onSubmit}
      iconName="check"
      label={submitLabel}
    >
      {submitLabel}
    </Button>
  );
}

export function ChecklistStepSubmitFooter(props: ChecklistStepSubmitBarProps) {
  const registry = useChecklistStepSubmitRegistry();
  const setRegistration = registry?.setRegistration;
  const markCompleteEligible = registry?.markCompleteEligible ?? true;
  const onSubmitRef = useRef(props.onSubmit);
  onSubmitRef.current = props.onSubmit;
  const checklistPending = useOptionalChecklistUpdatePending();
  const busy = Boolean(props.busy) || checklistPending;
  const submitDisabled = props.disabled || !markCompleteEligible;

  useEffect(() => {
    if (!setRegistration) return;
    setRegistration({
      disabled: submitDisabled,
      busy,
      onSubmit: () => {
        onSubmitRef.current();
      },
    });
    return () => {
      setRegistration(null);
    };
  }, [setRegistration, submitDisabled, busy]);

  return (
    <Box className="border-border mt-4 flex flex-row justify-end border-t pt-4">
      <ChecklistStepSubmitButton {...props} disabled={submitDisabled} busy={busy} />
    </Box>
  );
}
