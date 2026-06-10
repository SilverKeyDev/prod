import type { DropdownOption } from "./Dropdown.types";

export type { DropdownOption } from "./Dropdown.types";

export type MultiSelectDropdownProps<T = unknown> = {
  options: DropdownOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  /** Shown on the trigger when every option is selected. */
  allSelectedLabel?: string;
  label?: string;
  required?: boolean;
  error?: string | undefined;
  disabled?: boolean;
  searchable?: boolean;
  variant?: "default" | "mobile" | "compact";
  size?: "sm" | "md" | "lg";
  className?: string;
  dropdownClassName?: string;
  noBorder?: boolean;
  menuInPortal?: boolean;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  menuPlacement?: "below" | "above" | "overlap";
  hideLabel?: boolean;
  menuPortalStack?: "page" | "modal";
  maxVisibleOptions?: number;
};
