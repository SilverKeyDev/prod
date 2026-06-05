import React from "react";

import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "packages/ui/components/system/adapters/headless";

export type AccessibleDialogProps = {
  /** Unified accessibility label. Passed as aria-label to the dialog. */
  label?: string;
} & React.ComponentProps<typeof Dialog>;

/**
 * Dialog adapter with unified label prop. Use in features/pages instead of
 * passing aria-label directly so the design system can map per platform.
 * Use AccessibleDialog.Panel, AccessibleDialog.Title, etc.
 */
function AccessibleDialog({ label, ...props }: AccessibleDialogProps) {
  return <Dialog aria-label={label} {...props} />;
}

AccessibleDialog.Panel = DialogPanel;
AccessibleDialog.Title = DialogTitle;
AccessibleDialog.Description = Description;

export default AccessibleDialog;
