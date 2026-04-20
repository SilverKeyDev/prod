import React, { useEffect, useState } from "react";

import CloseButton from "packages/ui/components/button/CloseButton";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
import { getDocument } from "packages/utils/platform";

import type { CoverProps } from "./CoverTypes";

function getTransformClass(animation: CoverProps["animation"], hasEntered: boolean): string {
  if (animation === "none" || !animation) return "";
  if (!hasEntered) {
    if (animation === "slideFromRight") return "translate-x-full";
    if (animation === "slideFromLeft") return "-translate-x-full";
  }
  return "translate-x-0";
}

type CoverPanelProps = Pick<
  CoverProps,
  | "onClose"
  | "title"
  | "showCloseButton"
  | "children"
  | "headerContent"
  | "footerContent"
  | "showHeaderBorder"
  | "animation"
  | "className"
  | "headerContainerClassName"
  | "maxWidth"
> & { zIndex: number };

function CoverPanel({
  onClose,
  title,
  showCloseButton = true,
  children,
  headerContent,
  footerContent,
  showHeaderBorder = true,
  animation = "none",
  className = "",
  headerContainerClassName,
  maxWidth,
  zIndex,
}: CoverPanelProps) {
  const [hasEntered, setHasEntered] = useState(animation === "none");
  useEffect(() => {
    if (animation === "none") return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      setTimeout(() => {
        if (!cancelled) setHasEntered(true);
      }, 0);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [animation]);

  const transformClass = getTransformClass(animation, hasEntered);
  const transitionClass = animation !== "none" ? "transition-transform duration-300 ease-out" : "";
  const hasMaxWidth = maxWidth && maxWidth !== "100vw";

  const modalContent = (
    <Box
      className={`bg-background-base flex flex-col overflow-hidden ${transitionClass} ${transformClass} ${className} ${
        hasMaxWidth ? "shadow-2xl" : ""
      }`}
      style={
        hasMaxWidth
          ? { width: maxWidth, height: "100dvh", maxHeight: "100dvh" }
          : { position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex }
      }
      role="dialog"
      aria-modal="true"
    >
      {(title ?? headerContent ?? showCloseButton) && (
        <Box
          className={`flex min-h-0 flex-shrink-0 items-center justify-between gap-2 overflow-hidden ${
            headerContainerClassName ?? "p-3 sm:p-4 md:p-6"
          } ${showHeaderBorder ? "border-border border-b" : ""}`}
        >
          <Box className="scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
            {headerContent ??
              (title && (
                <Title
                  as="h3"
                  size="sm"
                  className="text-text-primary truncate font-medium sm:text-lg"
                >
                  {title}
                </Title>
              ))}
          </Box>
          {showCloseButton && (
            <CloseButton
              variant="ghost"
              size="overlay"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary ml-2 flex-shrink-0 touch-manipulation"
              label="Close"
            />
          )}
        </Box>
      )}
      <Box className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
        {children}
      </Box>
      {footerContent && (
        <Box className="border-border flex-shrink-0 border-t p-3 sm:p-4 md:p-6">
          {footerContent}
        </Box>
      )}
    </Box>
  );

  if (hasMaxWidth) {
    return (
      <Box
        className="bg-background-overlay/50 fixed inset-0 flex items-center justify-center"
        style={{ zIndex }}
      >
        {modalContent}
      </Box>
    );
  }

  return modalContent;
}

const Cover: React.FC<CoverProps> = (props) => {
  const { isOpen, onClose, closeOnEscape = true, zIndex = 10000 } = props;

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
      <CoverPanel {...props} zIndex={zIndex} />
    </Portal>
  );
};

export default Cover;
export type { CoverProps } from "./CoverTypes";
