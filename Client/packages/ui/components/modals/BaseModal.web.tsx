import React, { useEffect, useId } from "react";

import { Z_LAYERS } from "packages/design-tokens";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "packages/ui/components/adapters/headless";
import CloseButton from "packages/ui/components/button/core/CloseButton";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import { getDocument } from "packages/utils/platform";

import type { BaseModalProps } from "./BaseModalTypes";
import { SILVERKEY_MODAL_ROOT_DATA_ATTR } from "./BaseModalTypes";

const SIZE_STYLES: Record<NonNullable<BaseModalProps["size"]>, string> = {
  xs: "max-w-xs mx-responsive-sm",
  sm: "max-w-sm mx-responsive-sm",
  md: "max-w-md sm:max-w-lg mx-responsive-md",
  lg: "max-w-lg sm:max-w-xl mx-responsive-md",
  xl: "max-w-xl sm:max-w-2xl mx-responsive-lg",
  full: "max-w-full mx-responsive-sm",
};

type BaseModalPanelProps = Omit<BaseModalProps, "isOpen" | "zIndex"> & {
  titleId: string;
};

function BaseModalPanel({
  onClose,
  title,
  size,
  showCloseButton,
  className,
  children,
  headerContent,
  footerContent,
  showHeaderBorder,
  contentBackground,
  titleId,
}: BaseModalPanelProps) {
  return (
    <DialogPanel
      className={`relative flex min-h-0 w-full max-w-full transform flex-col overflow-hidden rounded-lg text-left shadow-xl transition-all sm:rounded-xl ${
        contentBackground === "off-white" ? "bg-background-base" : "bg-background-base"
      } ${SIZE_STYLES[size ?? "md"]} ${className ?? ""}`}
      style={{ maxHeight: "min(90vh, 90dvh)" }}
    >
      {(title ?? headerContent ?? showCloseButton) && (
        <Box
          className={`flex min-h-0 flex-shrink-0 items-center justify-between gap-2 overflow-hidden p-3 sm:p-4 md:p-6 ${
            showHeaderBorder ? "border-border border-b" : ""
          }`}
        >
          <Box
            className="scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
            style={{ maxHeight: "min(200px, 30vh)" }}
          >
            {headerContent ??
              (title && (
                <DialogTitle
                  id={titleId}
                  className="text-text-primary truncate text-sm font-semibold leading-snug"
                >
                  {title}
                </DialogTitle>
              ))}
          </Box>
          {showCloseButton && (
            <CloseButton
              variant="ghost"
              size="overlay"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary ml-2 flex-shrink-0 touch-manipulation"
              label="Close modal"
            />
          )}
        </Box>
      )}
      <Box className="scrollbar-hide min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        {children}
      </Box>
      {footerContent && (
        <Box className="border-border flex-shrink-0 border-t p-3 sm:p-4 md:p-6">
          {footerContent}
        </Box>
      )}
    </DialogPanel>
  );
}

const BaseModal: React.FC<BaseModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    zIndex = Z_LAYERS.modal,
    title,
    backdropClassName = "",
    ...panelProps
  } = props;

  const titleId = useId();
  const ariaLabel = title ?? "Dialog";

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const doc = getDocument();
    if (!doc) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    doc.addEventListener("keydown", handleEscape);
    return () => doc.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const doc = getDocument();
    if (!doc?.body) return;
    doc.body.style.overflow = "hidden";
    return () => {
      doc.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDialogClose = () => {
    if (closeOnBackdropClick) onClose();
  };

  return (
    <Portal>
      <Dialog
        open={isOpen}
        onClose={handleDialogClose}
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        className="relative"
        style={{ zIndex }}
        {...{ [SILVERKEY_MODAL_ROOT_DATA_ATTR]: true }}
      >
        <Box className="scrollbar-hide fixed-modal-dashboard-main fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <DialogBackdrop
            className={`bg-overlay-backdrop fixed-modal-dashboard-main fixed inset-0 transition-opacity ${backdropClassName}`}
          />
          <Box className="flex min-h-[100dvh] items-center justify-center p-2 sm:p-4 md:p-6">
            <BaseModalPanel {...panelProps} title={title} onClose={onClose} titleId={titleId} />
          </Box>
        </Box>
      </Dialog>
    </Portal>
  );
};

export default BaseModal;
export type { BaseModalProps } from "./BaseModalTypes";
