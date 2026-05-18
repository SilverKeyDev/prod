export type CompleteChecklistStepAfterIntegrationSubmitArgs = {
  /** Latest eligibility (use a ref in React callers). */
  canMarkChecked: () => boolean;
  commitToggleItem: (itemId: number) => void | Promise<void>;
  itemId: number;
  notifyBlocked: () => void;
  notifyError: () => void;
};

/**
 * After an integration step saves, mark the checklist item complete when progress rules allow.
 */
export async function completeChecklistStepAfterIntegrationSubmit(
  args: CompleteChecklistStepAfterIntegrationSubmitArgs
): Promise<void> {
  if (!args.canMarkChecked()) {
    args.notifyBlocked();
    return;
  }
  try {
    await args.commitToggleItem(args.itemId);
  } catch {
    args.notifyError();
  }
}

/** Fire-and-forget wrapper for integration `onComplete` handlers. */
export function runChecklistIntegrationComplete(
  args: CompleteChecklistStepAfterIntegrationSubmitArgs
): void {
  void completeChecklistStepAfterIntegrationSubmit(args);
}
