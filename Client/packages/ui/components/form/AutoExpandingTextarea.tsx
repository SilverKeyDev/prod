import React, { useEffect, useRef } from "react";

import { INPUT_AUTOFILL_CLASS_NAME } from "packages/ui/styles/variants/inputVariants";

interface AutoExpandingTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  minHeight?: number;
  maxHeight?: number;
  error?: boolean;
}

export const AutoExpandingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextareaProps
>(
  (
    {
      value,
      onChange,
      minHeight = 44,
      maxHeight = 120,
      error = false,
      className = "",
      style,
      onKeyDown,
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef =
      (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Auto-resize functionality
    useEffect(() => {
      if (textareaRef.current) {
        const textarea = textareaRef.current;

        // Reset height to auto to get the actual scrollHeight
        textarea.style.height = "auto";

        // Calculate new height within constraints
        const newHeight = Math.min(
          Math.max(textarea.scrollHeight, minHeight),
          maxHeight,
        );

        // Set the height
        textarea.style.height = `${newHeight}px`;

        // Handle overflow for content that exceeds maxHeight
        if (textarea.scrollHeight > maxHeight) {
          textarea.style.overflowY = "auto";
        } else {
          textarea.style.overflowY = "hidden";
        }
      }
    }, [value, minHeight, maxHeight, textareaRef]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter sends message, Shift+Enter adds new line (default textarea behavior)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // Let parent component handle the send action
      }

      onKeyDown?.(e);
    };

    const baseClasses = [
      "w-full border rounded-lg px-3 py-2",
      "resize-none overflow-hidden",
      "transition-all duration-200 ease-out",
      "focus:outline-none focus:ring-2",
      "text-sm sm:text-base leading-tight sm:leading-normal",
      // iOS zoom prevention - ensure minimum 16px font size
      "text-base sm:text-base",
      INPUT_AUTOFILL_CLASS_NAME,
    ].join(" ");

    const stateClasses = error
      ? "border-neutral-600 focus:ring-neutral-400 focus:border-neutral-700"
      : "border-border focus:ring-neutral-400 focus:border-input-variant-focus-border";

    const combinedStyle = {
      minHeight: `${minHeight}px`,
      maxHeight: `${maxHeight}px`,
      // Prevent iOS zoom on input focus
      fontSize: "16px",
      ...style,
    };

    return (
      // eslint-disable-next-line silverkey/no-primitive-components -- AutoExpandingTextarea is the textarea primitive implementation
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={`${baseClasses} ${stateClasses} ${className}`}
        style={combinedStyle}
        {...props}
      />
    );
  },
);

AutoExpandingTextarea.displayName = "AutoExpandingTextarea";
