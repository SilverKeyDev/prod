import React, { useEffect } from "react";
import { createPortal } from "react-dom";

import CloseButton from "@/components/ui/button/CloseButton";
import Title from "@/components/ui/text/Title";

export type BaseModalProps = {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing escape closes modal */
  closeOnEscape?: boolean;
  /** Additional className for modal content */
  className?: string;
  /** Additional className for backdrop */
  backdropClassName?: string;
  /** Children content */
  children: React.ReactNode;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Custom footer content */
  footerContent?: React.ReactNode;
  /** Z-index level */
  zIndex?: number;
  /** Whether to show the dividing line between header and body (default: true) */
  showHeaderBorder?: boolean;
  /** Background color for the modal container (default: neutral.50). Use "off-white" for housing/settings-style modals. */
  contentBackground?: "default" | "off-white";
};

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
      className={`relative flex min-h-0 w-full max-w-full flex-col transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:rounded-xl ${contentBackground === "off-white" ? "bg-off-white" : "bg-neutral-50"} ${SIZE_STYLES[size ?? "md"]} ${className ?? ""}`}
      style={{ maxHeight: "min(90vh, 90dvh)" }}
    >
      {(title ?? headerContent ?? showCloseButton) && (
        <div
          className={`flex min-h-0 flex-shrink-0 items-center justify-between gap-2 overflow-hidden p-3 sm:p-4 md:p-6 ${showHeaderBorder ? "border-b border-gray-200" : ""}`}
        >
          <div
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
            style={{ maxHeight: "min(200px, 30vh)" }}
          >
            {headerContent ??
              (title && (
                <Title
                  as="h3"
                  size="sm"
                  className="truncate font-medium text-gray-900 sm:text-lg"
                >
                  {title}
                </Title>
              ))}
          </div>
          {showCloseButton && (
            <CloseButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-2 flex-shrink-0 touch-manipulation text-gray-400 hover:text-gray-500"
              label="Close modal"
            />
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        {children}
      </div>
      {footerContent && (
        <div className="flex-shrink-0 border-t border-gray-200 p-3 sm:p-4 md:p-6">
          {footerContent}
        </div>
      )}
    </div>
  );
}

function BaseModalContent(p: BaseModalContentProps) {
  const {
    onClose,
    closeOnBackdropClick,
    backdropClassName = "",
    zIndex,
    ...rest
  } = p;
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
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return createPortal(
    <BaseModalContent {...props} zIndex={zIndex} />,
    document.body,
  );
};

export default BaseModal;
