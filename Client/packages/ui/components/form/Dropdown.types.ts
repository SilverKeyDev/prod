import type { ReactNode } from "react";

export type DropdownOption<T = unknown> = {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
};
