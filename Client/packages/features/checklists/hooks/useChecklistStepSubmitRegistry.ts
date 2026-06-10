import { createContext, useContext } from "react";

export type ChecklistStepSubmitRegistration = {
  disabled: boolean;
  busy: boolean;
  onSubmit: () => void;
};

export type ChecklistStepSubmitContextValue = {
  registration: ChecklistStepSubmitRegistration | null;
  setRegistration: (value: ChecklistStepSubmitRegistration | null) => void;
  /** When false, integration submit is disabled (checklist progress rules). */
  markCompleteEligible: boolean;
};

export const ChecklistStepSubmitContext = createContext<ChecklistStepSubmitContextValue | null>(
  null
);

/** Used by footer registration and header button. */

export function useChecklistStepSubmitRegistry(): ChecklistStepSubmitContextValue | null {
  return useContext(ChecklistStepSubmitContext);
}
