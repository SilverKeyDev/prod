import { useContext } from "react";

import {
  SearchHeaderPopoverDismissContext,
  type SearchHeaderPopoverDismissContextValue,
} from "./searchHeaderPopoverDismiss.context";

export function useSearchHeaderPopoverDismiss(): SearchHeaderPopoverDismissContextValue | null {
  return useContext(SearchHeaderPopoverDismissContext);
}
