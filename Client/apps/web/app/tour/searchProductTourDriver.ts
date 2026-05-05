import "driver.js/dist/driver.css";

import { type Driver, driver, type DriveStep } from "driver.js";

import {
  filterSearchProductTourStepsForDom,
  getSearchProductTourSteps,
  type SearchProductTourLayout,
  type SearchProductTourStep,
} from "packages/utils/tour/productTourSteps";
import {
  isSearchProductTourStepCompleted,
  markSearchProductTourStepCompleted,
} from "packages/utils/tour/productTourStorage";

function stepIdForDriveStep(
  step: DriveStep | undefined,
  sourcedSteps: SearchProductTourStep[]
): string | undefined {
  const el = step?.element;
  if (typeof el !== "string") return undefined;
  return sourcedSteps.find((s) => s.element === el)?.stepId;
}

function markStepIfKnown(
  step: DriveStep | undefined,
  sourcedSteps: SearchProductTourStep[]
): void {
  const id = stepIdForDriveStep(step, sourcedSteps);
  if (id) markSearchProductTourStepCompleted(id);
}

export function startSearchProductTour(options: {
  layout: SearchProductTourLayout;
  /** When true, show every step (e.g. `?productTour=1` replay from Settings). */
  includeCompletedSteps?: boolean;
}): Driver | null {
  const raw = getSearchProductTourSteps(options.layout);
  const scoped = options.includeCompletedSteps
    ? raw
    : raw.filter((s) => !isSearchProductTourStepCompleted(s.stepId));

  const steps = filterSearchProductTourStepsForDom(scoped);
  if (steps.length === 0) return null;

  const driveSteps: DriveStep[] = steps.map(({ element, popover }) => ({ element, popover }));

  const d = driver({
    steps: driveSteps,
    showProgress: true,
    allowClose: true,
    smoothScroll: true,
    stagePadding: 8,
    onNextClick: (_element, step, { driver: drv }) => {
      markStepIfKnown(step, steps);
      drv.moveNext();
    },
    onCloseClick: (_element, _step, { driver: drv }) => {
      drv.destroy();
    },
    onDestroyed: (_element, step) => {
      markStepIfKnown(step, steps);
    },
  });
  d.drive();
  return d;
}
