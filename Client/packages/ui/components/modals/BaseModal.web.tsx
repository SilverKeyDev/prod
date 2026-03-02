import React, { useEffect } from "react";

import CloseButton from "packages/ui/components/button/CloseButton";
import { Portal } from "packages/ui/components/portal";
import { getDocument } from "packages/utils/platform";

import Title from "@/components/ui/text/Title";

import type { BaseModalProps } from "./BaseModalTypes";

const SIZE_STYLES: Record<NonNullable<BaseModalProps["size"]>, string> = {
  xs: "max-w-xs mx-responsive-sm",
  sm: "max-w-sm mx-responsive-sm",
  md: "max-w-md sm:max-w-lg mx-responsive-md",
  lg: "max-w-lg sm:max-w-xl mx-responsive-md",
  xl: "max-w-xl sm:max-w-2xl mx-responsive-lg",
  full: "max-w-full mx-responsive-sm",
};

type BaseModalContentProps = BaseModalProps & { zIndex: number };

type BaseModalPanelProps = Omit<BaseModalContentProps, "zIndex">;

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
}: BaseModalPanelProps) {
  return (
    <div
      className={`relative flex min-h-0 w-full max-w-full transform flex-col overflow-hidden rounded-lg text-left shadow-xl transition-all sm:rounded-xl ${contentBackground === "off-white" ? "bg-off-white" : "bg-neutral-50"} ${SIZE_STYLES[size ?? "md"]} ${className ?? ""}`}
      style={{ maxHeight: "min(90vh, 90dvh)" }}
    >
      {(title ?? headerContent ?? showCloseButton) && (
        <div
          className={`flex min-h-0 flex-shrink-0 items-center justify-between gap-2 overflow-hidden p-3 sm:p-4 md:p-6 ${showHeaderBorder ? "border-b border-gray-200" : ""}`}
        >
          <div
            className="scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
            style={{ maxHeight: "min(200px, 30vh)" }}
          >
            {headerContent ??
              (title && (
                <Title as="h3" size="sm" className="truncate font-medium text-gray-900 sm:text-lg">
                  {title}
                </Title>
              ))}
          </div>
          {showCloseButton && (
            <CloseButton
              variant="ghost"
              size="overlay"
              onClick={onClose}
              className="ml-2 flex-shrink-0 touch-manipulation text-gray-400 hover:text-gray-500"
              label="Close modal"
            />
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</div>
      {footerContent && (
        <div className="flex-shrink-0 border-t border-gray-200 p-3 sm:p-4 md:p-6">
          {footerContent}
        </div>
      )}
    </div>
  );
}

function BaseModalContent(p: BaseModalContentProps) {
  const { onClose, closeOnBackdropClick, backdropClassName = "", zIndex, ...rest } = p;
  const handleBackdrop = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) onClose();
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && closeOnBackdropClick) {
      e.preventDefault();
      onClose();
    }
  };
  return (
    <div
      className="fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
      style={{ zIndex }}
    >
      <div
        role="button"
        tabIndex={0}
        className="flex min-h-[100dvh] items-center justify-center p-2 sm:p-4 md:p-6"
        onClick={handleBackdrop}
        onKeyDown={handleKeyDown}
      >
        <div
          className={`fixed inset-0 bg-black/50 transition-opacity ${backdropClassName}`}
          aria-hidden="true"
        />
        <BaseModalPanel {...rest} onClose={onClose} />
      </div>
    </div>
  );
}

const BaseModal: React.FC<BaseModalProps> = (props) => {
  const { isOpen, onClose, closeOnEscape = true, zIndex = 9999 } = props;

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
  return (
    <Portal>
      <BaseModalContent {...props} zIndex={zIndex} />
    </Portal>
  );
};

export default BaseModal;
export type { BaseModalProps } from "./BaseModalTypes";
