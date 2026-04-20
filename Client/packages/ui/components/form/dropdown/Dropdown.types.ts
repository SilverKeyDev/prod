import type { ReactNode } from "react";

export type DropdownOption<T = unknown> = {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  /** Merged into the menu row button className (e.g. availability hints). */
  menuRowClassName?: string;
};
