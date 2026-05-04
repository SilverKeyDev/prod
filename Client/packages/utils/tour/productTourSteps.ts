import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";

import { TOUR_TARGETS_DESKTOP, TOUR_TARGETS_MOBILE } from "./tourTargets";

export type SearchProductTourLayout = "desktop" | "mobile";

export type SearchProductTourStep = {
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
        element: sel(d.preferencesControl),
        popover: {
          title: tourCopy("search.product_tour.desktop.preferences_title"),
          description: tourCopy("search.product_tour.desktop.preferences_description"),
          side: "bottom",
          align: "start",
        },
      },
      {
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
      element: sel(m.preferencesControl),
      popover: {
        title: tourCopy("search.product_tour.mobile.preferences_title"),
        description: tourCopy("search.product_tour.mobile.preferences_description"),
        side: "bottom",
        align: "start",
      },
    },
    {
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
