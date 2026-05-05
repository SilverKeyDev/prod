import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";

import { TOUR_TARGETS_DESKTOP, TOUR_TARGETS_MOBILE } from "./tourTargets";

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
  const text = SEARCH_TRANSLATIONS[key];
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
      {
        stepId: "search.desktop.display",
        element: sel(d.displayControl),
        popover: {
          title: tourCopy("search.product_tour.desktop.display_title"),
          description: tourCopy("search.product_tour.desktop.display_description"),
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
    {
      stepId: "search.mobile.display",
      element: sel(m.displayControl),
      popover: {
        title: tourCopy("search.product_tour.mobile.display_title"),
        description: tourCopy("search.product_tour.mobile.display_description"),
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
  if (typeof document === "undefined") return [];
  return steps.filter((step) => document.querySelector(step.element) != null);
}
