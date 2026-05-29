import type { ActiveTab } from "@/features/search/store/types";

export type FocusResultsTabAfterSearchParams = {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentPage: (page: number) => void;
};

/** True when a committed search should move the user off the Saved tab. */
export function shouldFocusResultsTabAfterSearch(activeTab: ActiveTab): boolean {
  return activeTab === "saved";
}

/**
 * After polygon search results are committed, show the Results tab when the user
 * was still on Saved (so new matches are visible without a manual tab change).
 *
 * @returns whether the tab (and page) were updated
 */
export function applyFocusResultsTabAfterSearchComplete({
  activeTab,
  setActiveTab,
  setCurrentPage,
}: FocusResultsTabAfterSearchParams): boolean {
  if (!shouldFocusResultsTabAfterSearch(activeTab)) {
    return false;
  }
  setActiveTab("results");
  setCurrentPage(0);
  return true;
}
