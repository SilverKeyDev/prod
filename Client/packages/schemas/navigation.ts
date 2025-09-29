import type { LucideIcon } from "lucide-react";

// Updated NavItem type to use LucideIcon for better compatibility
export type NavItem = {
  key: string;
  to: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
};
