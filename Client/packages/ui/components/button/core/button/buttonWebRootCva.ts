import { cva } from "class-variance-authority";

import { BUTTON_TRANSITION_CLASSES } from "packages/ui/styles/transitions/transitionClasses";
import {
  BUTTON_BASE_CLASSES,
  BUTTON_LOADING_FRAME_CLASSES,
  BUTTON_LOADING_VARIANT_OVERRIDES,
  BUTTON_ROUNDED_CLASSES,
  BUTTON_SIZE_CLASSES,
  BUTTON_VARIANT_STYLES,
  type ButtonStyleVariant,
} from "packages/ui/styles/variants/buttonVariants";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

const roundedVariant = {
  none: BUTTON_ROUNDED_CLASSES.none,
  sm: BUTTON_ROUNDED_CLASSES.sm,
  md: BUTTON_ROUNDED_CLASSES.md,
  lg: BUTTON_ROUNDED_CLASSES.lg,
  xl: BUTTON_ROUNDED_CLASSES.xl,
  full: BUTTON_ROUNDED_CLASSES.full,
} as const;

const visualVariantMap = {
  primary: BUTTON_VARIANT_STYLES.primary,
  secondary: BUTTON_VARIANT_STYLES.secondary,
  tertiary: BUTTON_VARIANT_STYLES.tertiary,
  outline: BUTTON_VARIANT_STYLES.outline,
  ghost: BUTTON_VARIANT_STYLES.ghost,
  danger: BUTTON_VARIANT_STYLES.danger,
  success: BUTTON_VARIANT_STYLES.success,
} as const;

/**
 * Web-only declarative button chrome (CVA). Native continues to concatenate strings in the caller
 * because NativeWind + Babel may not apply CVA output at transform time.
 */
/* eslint-disable tailwindcss/no-contradicting-classname -- CVA align variant emits one justify-*; plugin false-positive on variant map */
export const buttonWebRootVariants = cva(
  [BUTTON_BASE_CLASSES, BUTTON_TRANSITION_CLASSES, "touch-friendly"],
  {
    variants: {
      size: {
        sm: BUTTON_SIZE_CLASSES.sm,
        md: BUTTON_SIZE_CLASSES.md,
        lg: BUTTON_SIZE_CLASSES.lg,
      },
      rounded: roundedVariant,
      visualVariant: visualVariantMap,
      fullWidth: { true: "w-full", false: "" },
      containerCollapse: { true: "@container", false: "" },
      align: {
        center: "justify-center",
        start: "justify-start",
        edge: "justify-between",
      },
      group: { true: "group", false: "" },
    },
    defaultVariants: {
      size: "md",
      rounded: "lg",
      visualVariant: "primary",
      fullWidth: false,
      containerCollapse: false,
      align: "center",
      group: true,
    },
  }
);
/* eslint-enable tailwindcss/no-contradicting-classname */

export type ButtonWebRootCvaInput = {
  size: keyof typeof BUTTON_SIZE_CLASSES;
  rounded: keyof typeof BUTTON_ROUNDED_CLASSES;
  effectiveVariant: ButtonStyleVariant;
  fullWidth: boolean;
  edgeRight: boolean;
  contentAlign: "center" | "start";
  loading: boolean;
  containerCollapse: boolean;
  applyGroup: boolean;
  consumerClassName: string;
};

export function resolveButtonWebRootClassName(input: ButtonWebRootCvaInput): string {
  const align = input.edgeRight ? "edge" : input.contentAlign === "start" ? "start" : "center";
  return twMergeClasses(
    buttonWebRootVariants({
      size: input.size,
      rounded: input.rounded,
      visualVariant: input.effectiveVariant,
      fullWidth: input.fullWidth,
      containerCollapse: input.containerCollapse,
      align,
      group: input.applyGroup,
    }),
    input.loading ? BUTTON_LOADING_FRAME_CLASSES : "",
    input.loading ? BUTTON_LOADING_VARIANT_OVERRIDES[input.effectiveVariant] : "",
    input.consumerClassName
  );
}

/** Native / fallback: same tokens as pre-CVA, with predictable consumer `className` merge. */
export function resolveButtonRootClassNameNativeLike(input: ButtonWebRootCvaInput): string {
  const mainAxisJustify = input.edgeRight
    ? ""
    : input.contentAlign === "start"
      ? "justify-start"
      : "justify-center";
  const layoutClass = input.edgeRight ? "justify-between" : "";
  return twMergeClasses(
    BUTTON_BASE_CLASSES,
    mainAxisJustify,
    BUTTON_TRANSITION_CLASSES,
    BUTTON_SIZE_CLASSES[input.size],
    BUTTON_ROUNDED_CLASSES[input.rounded],
    BUTTON_VARIANT_STYLES[input.effectiveVariant],
    input.fullWidth ? "w-full" : "",
    layoutClass,
    input.loading
      ? `${BUTTON_LOADING_FRAME_CLASSES} ${BUTTON_LOADING_VARIANT_OVERRIDES[input.effectiveVariant]}`
      : "",
    input.containerCollapse ? "@container" : "",
    "touch-friendly",
    input.applyGroup ? "group" : "",
    input.consumerClassName
  );
}
