import "driver.js/dist/driver.css";

import { type Driver, driver, type DriveStep } from "driver.js";

import {
  getSearchProductTourSteps,
  type SearchProductTourLayout,
} from "packages/utils/tour/productTourSteps";
import { markProductTourCompleted } from "packages/utils/tour/productTourStorage";

export function filterSearchTourStepsForDom(steps: DriveStep[]): DriveStep[] {
  if (typeof document === "undefined") return [];
  return steps.filter((step) => {
    const el = step.element;
    if (typeof el !== "string") return false;
    return document.querySelector(el) != null;
  });
}

export function startSearchProductTour(options: {
  layout: SearchProductTourLayout;
}): Driver | null {
  const raw = getSearchProductTourSteps(options.layout) as DriveStep[];
  const steps = filterSearchTourStepsForDom(raw);
  if (steps.length === 0) return null;

  const d = driver({
    steps,
    showProgress: true,
    allowClose: true,
    smoothScroll: true,
    stagePadding: 8,
    onDestroyed: () => {
      markProductTourCompleted();
    },
  });
  d.drive();
  return d;
}
