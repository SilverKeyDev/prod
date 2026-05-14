import { PRESSABLE_FORWARD_KEYS } from "./constants";

export function pickPressableProps(props: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of PRESSABLE_FORWARD_KEYS) {
    if (key in props && props[key] !== undefined) {
      result[key] = props[key];
    }
  }
  return result;
}

export function mergeButtonAccessibilityState(
  pressableProps: Record<string, unknown>,
  loading: boolean
): Record<string, boolean | undefined> {
  const priorA11yState =
    pressableProps.accessibilityState &&
    typeof pressableProps.accessibilityState === "object" &&
    !Array.isArray(pressableProps.accessibilityState)
      ? (pressableProps.accessibilityState as Record<string, boolean | undefined>)
      : {};
  return { ...priorA11yState, busy: loading };
}
