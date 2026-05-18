import { createContext } from "react";

export type CloseFn = () => void;

export type SearchHeaderPopoverDismissContextValue = {
  register: (close: CloseFn) => () => void;
  dismissAll: () => void;
};

export const SearchHeaderPopoverDismissContext =
  createContext<SearchHeaderPopoverDismissContextValue | null>(null);
