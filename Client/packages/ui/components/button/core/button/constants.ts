/** Web container-query breakpoint: show text beside icon when button inline-size ≥ 11rem. */
export const BUTTON_WEB_ICON_COLLAPSE_SHOW_LABEL_AT = "@[11rem]";

/** RN-safe props to forward to Pressable */
export const PRESSABLE_FORWARD_KEYS = [
  "testID",
  "accessibilityRole",
  "accessibilityState",
  "accessibilityHint",
  "accessibilityLevel",
  "nativeID",
] as const;
