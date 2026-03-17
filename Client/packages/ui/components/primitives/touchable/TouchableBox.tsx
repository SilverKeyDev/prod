/**
 * Cross-platform touchable container
 * Web: Uses div with mouse/keyboard event handlers. Applies hover: and active: from interactionStyles.
 * Native: Uses Pressable. Applies pressed classes and hitSlop.
 */
import React, { forwardRef } from "react";

import { Box } from "@ui/primitives/box";

import type { TouchableBoxProps } from "./TouchableBox.types";
import { TOUCHABLE_DISABLED_CLASSES } from "./touchableBoxStyles";

function buildInteractionClasses(
  interactionStyles: TouchableBoxProps["interactionStyles"]
): string {
  if (!interactionStyles) return "";
  const parts: string[] = [];
  if (interactionStyles.base) parts.push(interactionStyles.base);
  if (interactionStyles.hover) {
    const hoverPrefix = "hover" + ":";
    const h = interactionStyles.hover.startsWith(hoverPrefix)
      ? interactionStyles.hover
      : hoverPrefix + interactionStyles.hover;
    parts.push(h);
    if (!interactionStyles.pressed) {
      parts.push("active:opacity-90");
    }
  }
  if (interactionStyles.pressed) {
    const p = interactionStyles.pressed.startsWith("active:")
      ? interactionStyles.pressed
      : `active:${interactionStyles.pressed}`;
    parts.push(p);
  }
  return parts.join(" ");
}

/**
 * Web implementation using div with event handlers
 */
const TouchableBox = forwardRef<HTMLDivElement, TouchableBoxProps>(function TouchableBox(
  {
    children,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    disabled,
    label,
    className = "",
    style,
    interactionStyles,
    hitSlop: _hitSlop,
    ...props
  },
  ref
) {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    onPress?.();
  };

  const handleMouseDown = (_e: React.MouseEvent) => {
    if (disabled) return;
    onPressIn?.();
  };

  const handleMouseUp = (_e: React.MouseEvent) => {
    if (disabled) return;
    onPressOut?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPress?.();
    }
  };

  // Long press handling for web
  const longPressRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseDownLongPress = (e: React.MouseEvent) => {
    if (disabled || !onLongPress) return;
    handleMouseDown(e);
    longPressRef.current = setTimeout(() => {
      onLongPress();
    }, 500); // 500ms long press threshold
  };

  const handleMouseUpLongPress = (e: React.MouseEvent) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    handleMouseUp(e);
  };

  const handleMouseLeave = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (!disabled) {
      onPressOut?.();
    }
  };

  const isInteractive = onPress || onPressIn || onPressOut || onLongPress;
  const interactiveProps = isInteractive
    ? {
        tabIndex: disabled ? -1 : 0,
        role: "button",
        ...(label && { "aria-label": label }),
        onClick: handleClick,
        onMouseDown: onLongPress ? handleMouseDownLongPress : handleMouseDown,
        onMouseUp: onLongPress ? handleMouseUpLongPress : handleMouseUp,
        onMouseLeave: handleMouseLeave,
        onKeyDown: handleKeyDown,
        style: {
          cursor: disabled ? "default" : "pointer",
          userSelect: "none" as const,
          ...style,
        },
      }
    : { style };

  const interactionClasses = buildInteractionClasses(interactionStyles);

  return (
    <Box
      ref={ref}
      // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
      className={`${disabled ? TOUCHABLE_DISABLED_CLASSES : ""} ${interactionClasses} ${className}`}
      {...interactiveProps}
      {...props}
    >
      {children}
    </Box>
  );
});

export default TouchableBox;
