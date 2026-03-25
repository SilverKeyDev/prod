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

  return (
    <Box
      className={`bg-background-base fixed inset-0 flex flex-col overflow-hidden ${transitionClass} ${transformClass} ${className}`}
      style={{
        zIndex,
        width: "100vw",
        height: "100dvh",
        maxHeight: "100dvh",
      }}
      role="dialog"
      aria-modal="true"
    >
      {(title ?? headerContent ?? showCloseButton) && (
        <Box
          className={`flex min-h-0 flex-shrink-0 items-center justify-between gap-2 overflow-hidden ${headerContainerClassName ?? "p-3 sm:p-4 md:p-6"} ${showHeaderBorder ? "border-border border-b" : ""}`}
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
}

const Cover: React.FC<CoverProps> = (props) => {
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
      <CoverPanel {...props} zIndex={zIndex} />
    </Portal>
  );
};

export default Cover;
export type { CoverProps } from "./CoverTypes";
