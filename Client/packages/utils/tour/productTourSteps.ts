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
        element: sel(d.searchLocation),
        popover: {
          title: tourCopy("search.product_tour.desktop.search_location_title"),
          description: tourCopy("search.product_tour.desktop.search_location_description"),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: sel(d.searchRun),
        popover: {
          title: tourCopy("search.product_tour.desktop.run_search_title"),
          description: tourCopy("search.product_tour.desktop.run_search_description"),
          side: "bottom",
          align: "center",
        },
      },
      {
        element: sel(d.resultsTabs),
        popover: {
          title: tourCopy("search.product_tour.desktop.results_tabs_title"),
          description: tourCopy("search.product_tour.desktop.results_tabs_description"),
          side: "right",
          align: "start",
        },
      },
      {
        element: sel(d.resultsList),
        popover: {
          title: tourCopy("search.product_tour.desktop.listing_cards_title"),
          description: tourCopy("search.product_tour.desktop.listing_cards_description"),
          side: "right",
          align: "start",
        },
      },
      {
        element: sel(d.mapArea),
        popover: {
          title: tourCopy("search.product_tour.desktop.map_title"),
          description: tourCopy("search.product_tour.desktop.map_description"),
          side: "left",
          align: "start",
        },
      },
    ];
  }

  return [
    {
      element: sel(m.searchRun),
      popover: {
        title: tourCopy("search.product_tour.mobile.search_title"),
        description: tourCopy("search.product_tour.mobile.search_description"),
        side: "bottom",
        align: "center",
      },
    },
    {
      element: sel(m.resultsTabs),
      popover: {
        title: tourCopy("search.product_tour.mobile.results_tabs_title"),
        description: tourCopy("search.product_tour.mobile.results_tabs_description"),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: sel(m.resultsList),
      popover: {
        title: tourCopy("search.product_tour.mobile.carousel_title"),
        description: tourCopy("search.product_tour.mobile.carousel_description"),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: sel(m.mapArea),
      popover: {
        title: tourCopy("search.product_tour.mobile.map_title"),
        description: tourCopy("search.product_tour.mobile.map_description"),
        side: "top",
        align: "start",
      },
    },
  ];
}
