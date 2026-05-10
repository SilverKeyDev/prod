import type { ReactNode } from "react";

import IconButton from "packages/ui/components/button/IconButton";
import { Box } from "packages/ui/components/primitives";

/** Shared chrome: border, width, padding (Tailwind). */
export const TOAST_SURFACE_BASE = "border-border max-w-xs rounded-lg border p-2 sm:max-w-md";

/** Fixed bottom-right stacking context. */
export const TOAST_SHELL = "z-toast fixed bottom-1.5 right-1.5 sm:bottom-2 sm:right-2";

const ROW = "gap-responsive-sm flex items-start justify-between";

/** Neutral close control — same for every variant. */
const CLOSE_ICON_BUTTON_CLASS = "flex-shrink-0 text-gray-500 hover:text-gray-700";

export type BaseToastFrameProps = {
  surfaceClassName: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Layout shell for all web toasts: surface + row with message slot and gray dismiss.
 */
export default function BaseToastFrame({
  surfaceClassName,
  closeLabel,
  onClose,
  children,
}: BaseToastFrameProps) {
  return (
    <Box className={TOAST_SHELL}>
      <Box className={`${TOAST_SURFACE_BASE} ${surfaceClassName}`}>
        <Box className={ROW}>
          {children}
          <IconButton
            variant="ghost"
            size="sm"
            label={closeLabel}
            onClick={onClose}
            className={CLOSE_ICON_BUTTON_CLASS}
            iconName="x"
          />
        </Box>
      </Box>
    </Box>
  );
}
