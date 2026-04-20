import { useEffect, useRef } from "react";

import { useLocalization } from "packages/contexts";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";

import { useChecklistStepSubmitRegistry } from "./ChecklistStepSubmitContext";

export type ChecklistStepSubmitBarProps = {
  disabled: boolean;
  onSubmit: () => void;
  busy?: boolean;
};

function ChecklistStepSubmitButton({ disabled, onSubmit, busy = false }: ChecklistStepSubmitBarProps) {
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
  const onSubmitRef = useRef(props.onSubmit);
  onSubmitRef.current = props.onSubmit;
  const busy = props.busy ?? false;

  useEffect(() => {
    if (!setRegistration) return;
    setRegistration({
      disabled: props.disabled,
      busy,
      onSubmit: () => {
        onSubmitRef.current();
      },
    });
    return () => {
      setRegistration(null);
    };
  }, [setRegistration, props.disabled, busy]);

  return (
    <Box className="border-border mt-4 flex flex-row justify-end border-t pt-4">
      <ChecklistStepSubmitButton {...props} />
    </Box>
  );
}
