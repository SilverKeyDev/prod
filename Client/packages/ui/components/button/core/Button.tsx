import React, { Children, forwardRef, isValidElement, useMemo } from "react";

import { Slot } from "@radix-ui/react-slot";
import { Icon } from "@ui/icons";

import { getEnv } from "packages/config/env";
import { log } from "packages/logger";
import { Pressable } from "packages/ui/components/primitives";
import { tailwindButtonLabelHoverTypography } from "packages/ui/styles/theme/navTabTypography";
import { buttonNativeSizes } from "packages/ui/styles/variants/buttonSizes";
import {
  BUTTON_ICON_SIZE_CLASS,
  BUTTON_TEXT_COLOR_CLASSES,
  BUTTON_TEXT_SIZE_CLASSES,
  type ButtonStyleVariant,
} from "packages/ui/styles/variants/buttonVariants";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";
import { isNative } from "packages/utils/platform";

import { warnButtonAsChildDev } from "./button/buttonDevWarnings";
import { ButtonIcon, ButtonLabel } from "./button/buttonSlots";
import type { ButtonProps } from "./button/buttonTypes";
import {
  resolveButtonRootClassNameNativeLike,
  resolveButtonWebRootClassName,
} from "./button/buttonWebRootCva";
import { shouldCollapseIconLabelRowOnWeb, warnButtonCollapseA11yIfNeeded } from "./button/collapse";
import { BUTTON_WEB_ICON_COLLAPSE_SHOW_LABEL_AT } from "./button/constants";
import { mergeButtonAccessibilityState, pickPressableProps } from "./button/pressableProps";
import { renderButtonIcon } from "./button/renderIcon";
import { buildButtonTextVisibilityClass } from "./button/textVisibility";
import { renderButtonLabelSlot } from "./buttonLabelSlot";
import {
  renderButtonEdgeRightRow,
  renderButtonLoadingPreservedLayout,
  renderButtonStandardRow,
} from "./buttonRowContent";

export type { ButtonProps, ButtonVariant } from "./button/buttonTypes";

// ----- Design decisions (locked) -----
// - cancel variant: alias to ghost (recommended for cancel actions).
// - outline/ghost hover: tint only (bg-neutral-100), never full fill.
// - primary + tertiary: always white text; filled buttons use subtle darken on hover (/90).
// - Disabled: pointer-events-none in base; no disabled:hover:* in variants (they never trigger).
// ----- Button group guidance -----
// Confirmations: primary + ghost (cancel). Yes = primary, Cancel = ghost.
// "Back / Next": outline + primary, or secondary + primary, depending on vibe.

function buildLoadedRowContent(args: {
  textColorClass: string;
  isEdgeRight: boolean;
  iconLeft: boolean;
  iconRight: boolean;
  resolvedIcon: React.ReactNode;
  textContent: React.ReactNode;
  size: NonNullable<ButtonProps["size"]>;
  contentAlign: NonNullable<ButtonProps["contentAlign"]>;
}): React.ReactNode {
  if (args.isEdgeRight) {
    return renderButtonEdgeRightRow({
      iconLeft: args.iconLeft,
      iconRight: args.iconRight,
      resolvedIcon: args.resolvedIcon,
      textContent: args.textContent,
      size: args.size,
      textColorClass: args.textColorClass,
      renderIcon: renderButtonIcon,
    });
  }
  return renderButtonStandardRow({
    iconLeft: args.iconLeft,
    iconRight: args.iconRight,
    resolvedIcon: args.resolvedIcon,
    textContent: args.textContent,
    contentAlign: args.contentAlign,
    size: args.size,
    textColorClass: args.textColorClass,
    renderIcon: renderButtonIcon,
  });
}

function buildButtonRowContent(args: {
  loading: boolean;
  textColorClass: string;
  isEdgeRight: boolean;
  iconLeft: boolean;
  iconRight: boolean;
  resolvedIcon: React.ReactNode;
  textContent: React.ReactNode;
  size: NonNullable<ButtonProps["size"]>;
  contentAlign: NonNullable<ButtonProps["contentAlign"]>;
}): React.ReactNode {
  const loaded = buildLoadedRowContent({
    textColorClass: args.textColorClass,
    isEdgeRight: args.isEdgeRight,
    iconLeft: args.iconLeft,
    iconRight: args.iconRight,
    resolvedIcon: args.resolvedIcon,
    textContent: args.textContent,
    size: args.size,
    contentAlign: args.contentAlign,
  });
  if (!args.loading) return loaded;
  return renderButtonLoadingPreservedLayout({
    preservedRow: loaded,
    textColorClass: args.textColorClass,
  });
}

const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  // Orchestrates variants, icons, collapse, loading layout, a11y, and optional asChild (see button hardening plan).

  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconName,
      iconPosition = "left",
      iconAlign = "inline",
      contentAlign = "center",
      fullWidth = false,
      rounded = "lg",
      className = "",
      children,
      disabled,
      hideTextBelow,
      truncateLabel = true,
      collapseIconWhenNarrow = false,
      asChild = false,
      label,
      type = "button",
      onClick,
      onPress,
      labelSlotClassName,
      title,
      style,
      id,
      role,
      "aria-current": ariaCurrent,
      tabIndex,
      "aria-label": ariaLabel,
      "aria-expanded": ariaExpanded,
      "aria-controls": ariaControls,
      "aria-haspopup": ariaHaspopup,
      "aria-selected": ariaSelected,
      ...props
    },
    ref
  ) => {
    const effectiveVariant: ButtonStyleVariant = variant === "cancel" ? "ghost" : variant;
    const textColorClass = BUTTON_TEXT_COLOR_CLASSES[effectiveVariant];
    const textSizeClass = BUTTON_TEXT_SIZE_CLASSES[size];
    const iconClassName = twMergeClasses(BUTTON_ICON_SIZE_CLASS[size], textColorClass);

    const resolvedIcon =
      icon ?? (iconName ? <Icon name={iconName} className={iconClassName} /> : null);

    warnButtonAsChildDev({ asChild, isNative, icon, iconName, loading });

    /** Web-only: when cramped, hide label and keep icon (container queries). */
    const containerCollapse =
      !isNative &&
      shouldCollapseIconLabelRowOnWeb({
        collapseIconWhenNarrow,
        hideTextBelow,
        loading,
        resolvedIcon,
        children,
      });

    const derivedAccessibleLabel =
      ariaLabel ?? label ?? (typeof children === "string" ? children : undefined);

    warnButtonCollapseA11yIfNeeded({
      containerCollapse,
      children,
      derivedAccessibleLabel,
    });

    const handlePress = onPress ?? onClick;

    const textVisibilityClass = useMemo(
      () => buildButtonTextVisibilityClass(children, hideTextBelow),
      [children, hideTextBelow]
    );

    const isEdgeRight = iconPosition === "right" && iconAlign === "edge" && Boolean(resolvedIcon);
    const edgeRight = Boolean(isEdgeRight);

    const cvaInput = {
      size,
      rounded,
      effectiveVariant,
      fullWidth,
      edgeRight,
      contentAlign,
      loading,
      containerCollapse,
      applyGroup: !isNative && !loading,
      consumerClassName: className,
    };

    const buttonClasses = isNative
      ? resolveButtonRootClassNameNativeLike(cvaInput)
      : resolveButtonWebRootClassName(cvaInput);

    const iconLeft = Boolean(resolvedIcon && iconPosition === "left");
    const iconRight = Boolean(resolvedIcon && iconPosition === "right");

    const contentInnerLayoutClass =
      contentAlign === "start"
        ? "inline-flex w-full flex-row items-center justify-start gap-2 text-left font-medium leading-[1.2]"
        : "inline-flex flex-row items-center justify-center gap-2 text-center font-medium leading-[1.2]";

    const textContent = renderButtonLabelSlot({
      children,
      containerCollapse,
      contentAlign,
      textVisibilityClass,
      contentInnerLayoutClass,
      collapseShowLabelAt: BUTTON_WEB_ICON_COLLAPSE_SHOW_LABEL_AT,
      textColorClass,
      textSizeClass,
      truncateLabel,
      labelSlotClassName,
      groupHoverLabelClassName:
        !isNative && !loading ? tailwindButtonLabelHoverTypography[size] : undefined,
    });

    if (getEnv().isDevelopment && hideTextBelow && !label && !ariaLabel) {
      log.warn(
        "ERRORS",
        "[Button] hideTextBelow is set but label or aria-label is missing. Provide label for accessibility when text is hidden."
      );
    }

    const content = buildButtonRowContent({
      loading,
      textColorClass,
      isEdgeRight,
      iconLeft,
      iconRight,
      resolvedIcon,
      textContent,
      size,
      contentAlign,
    });

    const pressableProps = pickPressableProps(props as Record<string, unknown>);
    const mergedAccessibilityState = mergeButtonAccessibilityState(
      pressableProps as Record<string, unknown>,
      loading
    );

    const nativeSizeStyle = isNative ? buttonNativeSizes[size ?? "md"] : undefined;
    const mergedStyle = isNative ? [nativeSizeStyle, style].filter(Boolean) : style;

    const useAsChild = Boolean(asChild && !isNative);
    if (useAsChild) {
      let onlyChild: React.ReactElement | null = null;
      try {
        onlyChild = Children.only(children) as React.ReactElement;
      } catch {
        onlyChild = null;
      }
      if (!onlyChild || !isValidElement(onlyChild)) {
        if (getEnv().isDevelopment) {
          log.warn(
            "ERRORS",
            "[Button] asChild requires a single React element child; falling back to default button rendering."
          );
        }
      } else {
        const slotClassName = twMergeClasses(buttonClasses);
        const isBusy = Boolean(loading);
        const isDisabled = Boolean(disabled ?? loading);
        return (
          <Slot
            ref={ref as React.Ref<HTMLElement>}
            {...({
              className: slotClassName,
              "data-disabled": isDisabled ? "true" : undefined,
              "aria-disabled": isDisabled ? true : undefined,
              "aria-busy": isBusy ? true : undefined,
              "aria-label": derivedAccessibleLabel,
              title: title ?? derivedAccessibleLabel,
              id,
              role,
              "aria-current": ariaCurrent,
              "aria-expanded": ariaExpanded,
              "aria-controls": ariaControls,
              "aria-haspopup": ariaHaspopup,
              "aria-selected": ariaSelected,
              tabIndex,
              onClick: handlePress as React.MouseEventHandler<HTMLElement>,
              children: onlyChild,
            } as React.ComponentPropsWithoutRef<typeof Slot>)}
          />
        );
      }
    }

    return (
      <Pressable
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled ?? loading}
        onPress={handlePress}
        aria-label={derivedAccessibleLabel}
        {...(isNative ? { accessibilityLabel: derivedAccessibleLabel } : {})}
        title={title ?? derivedAccessibleLabel}
        style={mergedStyle}
        id={id}
        role={role}
        aria-current={ariaCurrent}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-haspopup={ariaHaspopup}
        aria-selected={ariaSelected}
        tabIndex={tabIndex}
        {...pressableProps}
        aria-busy={loading}
        {...(isNative ? { accessibilityState: mergedAccessibilityState } : {})}
      >
        {content}
      </Pressable>
    );
  }
);

Button.displayName = "Button";

const ButtonWithSlots = Object.assign(Button, {
  Icon: ButtonIcon,
  Label: ButtonLabel,
});

export default ButtonWithSlots;
