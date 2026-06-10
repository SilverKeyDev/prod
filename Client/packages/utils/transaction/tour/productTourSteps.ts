import { getDocument } from "packages/utils/core/platform";

import { TOUR_TARGETS_DESKTOP, TOUR_TARGETS_MOBILE } from "./tourTargets";

const SEARCH_PRODUCT_TOUR_COPY: Record<string, string> = {
  "search.product_tour.desktop.preferences_title": "Preferences",
  "search.product_tour.desktop.preferences_description":
    "Open Preferences for budgets, beds and baths, commute and important locations, how results are ordered and shown on the map, and the other fields that shape your matches. Changes save to your profile.",
  "search.product_tour.mobile.preferences_title": "Filters",
  "search.product_tour.mobile.preferences_description":
    "Open Filters for the same preference controls as on desktop: budget, home details, commute and locations, result ordering, and more. They stay in sync with your profile.",
};

export type SearchProductTourLayout = "desktop" | "mobile";

export type SearchProductTourStep = {
  /** Stable id for localStorage (layout + control). */
  stepId: string;
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left" | "over";
    align?: "start" | "center" | "end";
  };
};

function tourCopy(key: string): string {
  const text = SEARCH_PRODUCT_TOUR_COPY[key];
  return typeof text === "string" ? text : key;
}

function sel(id: string): string {
  return `#${id}`;
}

export function getSearchProductTourSteps(
  layout: SearchProductTourLayout
): SearchProductTourStep[] {
  const d = TOUR_TARGETS_DESKTOP;
  const m = TOUR_TARGETS_MOBILE;

  if (layout === "desktop") {
    return [
      {
        stepId: "search.desktop.preferences",
        element: sel(d.preferencesControl),
        popover: {
          title: tourCopy("search.product_tour.desktop.preferences_title"),
          description: tourCopy("search.product_tour.desktop.preferences_description"),
          side: "bottom",
          align: "start",
        },
      },
    ];
  }

  return [
    {
      stepId: "search.mobile.preferences",
      element: sel(m.preferencesControl),
      popover: {
        title: tourCopy("search.product_tour.mobile.preferences_title"),
        description: tourCopy("search.product_tour.mobile.preferences_description"),
        side: "bottom",
        align: "start",
      },
    },
  ];
}

/** Drop steps whose targets are not in the DOM (SSR, feature flags, layout). */
export function filterSearchProductTourStepsForDom(
  steps: SearchProductTourStep[]
): SearchProductTourStep[] {
  const doc = getDocument();
  if (!doc) return steps;
  return steps.filter((step) => doc.querySelector(step.element) != null);
}
