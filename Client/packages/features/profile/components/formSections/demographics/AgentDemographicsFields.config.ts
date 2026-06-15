import { PROFILE_NOT_SPECIFIED_LABEL } from "packages/features/profile/utils";

export const HAS_BUYERS_AGENT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

export function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined
): string {
  if (!value) return PROFILE_NOT_SPECIFIED_LABEL;
  return options.find((o) => o.value === value)?.label ?? PROFILE_NOT_SPECIFIED_LABEL;
}
