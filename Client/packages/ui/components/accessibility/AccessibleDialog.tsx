import React from "react";

import { Dialog } from "packages/ui/components/adapters/headless";

export type AccessibleDialogProps = {
  /** Unified accessibility label. Passed as aria-label to the dialog. */
  label?: string;
} & React.ComponentProps<typeof Dialog>;

/**
 * Dialog adapter with unified label prop. Use in features/pages instead of
 * passing aria-label directly so the design system can map per platform.
 * Use AccessibleDialog.Panel, AccessibleDialog.Title, etc. as with Dialog.
 */
function AccessibleDialog({ label, ...props }: AccessibleDialogProps) {
  return <Dialog aria-label={label} {...props} />;
}

AccessibleDialog.Panel = Dialog.Panel;
AccessibleDialog.Title = Dialog.Title;
AccessibleDialog.Description = Dialog.Description;

export default AccessibleDialog;
