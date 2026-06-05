import { type CSSProperties, useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { color, spacing, Z_LAYERS } from "packages/design-tokens";
import { Button, IconButton } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { boxShadow } from "packages/ui/styles/shadows/shadows.web";
import { getDocument, getWindow } from "packages/utils/core/platform";

import type { CreateEventModalFormProps } from "./CreateEventModalForm";
import { CreateEventModalFormCore } from "./CreateEventModalForm";

export type CreateEventFormPopoverAnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type CreateEventFormPopoverProps = {
  anchorRect: CreateEventFormPopoverAnchorRect | null;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
} & CreateEventModalFormProps;

export function CreateEventFormPopover({
  anchorRect,
  registerOutsideClickSafeTarget,
  // Stripped before `CreateEventModalFormCore` (popover has no modal shell).
  isOpen: _isOpen,
  onClose,
  modalTitle: _modalTitle,
  canSubmit,
  isSubmitting,
  primaryActionLabel,
  onSubmit,
  ...coreForFields
}: CreateEventFormPopoverProps) {
  const { t } = useLocalization();
  const panelId = useId();

  const handleSubmitPress = useCallback(() => {
    void onSubmit();
  }, [onSubmit]);

  useEffect(() => {
    if (!anchorRect) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    const doc = getDocument();
    doc?.addEventListener("keydown", onKeyDown, true);
    return () => doc?.removeEventListener("keydown", onKeyDown, true);
  }, [anchorRect, onClose]);

  const win = getWindow();
  const doc = getDocument();
  if (!anchorRect || !win || !doc?.body) {
    return null;
  }

  const panelWidth = Math.min(400, Math.max(320, win.innerWidth - 16));
  const panelStyle: CSSProperties = {
    position: "fixed",
    top: Math.min(anchorRect.top + anchorRect.height + 8, win.innerHeight - 120),
    left: Math.max(8, Math.min(anchorRect.left, win.innerWidth - panelWidth - 8)),
    width: panelWidth,
    maxHeight: "min(560px, 85vh)",
    overflowY: "auto",
    zIndex: Z_LAYERS.dropdown,
    backgroundColor: color("neutral.50"),
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: spacing(2),
    padding: spacing(3),
    boxShadow: boxShadow("floating"),
  };

  return createPortal(
    <Box
      data-silverkey-create-event-form-popover=""
      id={panelId}
      style={panelStyle}
      className="flex flex-col gap-3"
    >
      <Box className="-mt-1 mb-0 flex items-start justify-end gap-2">
        <IconButton
          variant="ghost"
          size="sm"
          label={t("feedback.close_aria")}
          onPress={onClose}
          disabled={isSubmitting}
          className="text-text-secondary hover:text-text-primary -mr-1 shrink-0"
        >
          <Icon name="x" className="h-4 w-4" />
        </IconButton>
      </Box>

      <CreateEventModalFormCore
        {...coreForFields}
        registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
      />

      <Box className="flex justify-end pt-1">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onPress={handleSubmitPress}
          disabled={!canSubmit || isSubmitting}
          loading={isSubmitting}
        >
          {primaryActionLabel}
        </Button>
      </Box>
    </Box>,
    doc.body
  );
}
