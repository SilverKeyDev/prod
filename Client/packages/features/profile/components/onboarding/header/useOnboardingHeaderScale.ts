import { type RefObject, useEffect, useRef, useState } from "react";

import { getDocument, getWindow } from "packages/utils/core/platform";

import { ONBOARDING_HEADER_MIN_SCALE } from "./onboardingHeaderMotion";

export function useOnboardingHeaderScale(stepCount: number) {
  const outerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const outerElement = outerRef.current;
    const gridElement = gridRef.current;
    const recalc = () => {
      const outer = outerRef.current;
      const grid = gridRef.current;
      if (!outer || !grid) return;
      const available = outer.clientWidth;
      const natural = grid.scrollWidth;
      if (natural <= 0 || available <= 0) {
        setScale(1);
        return;
      }
      const needed = available / natural;
      const newScale = Math.max(ONBOARDING_HEADER_MIN_SCALE, Math.min(1, needed));
      setScale(newScale);
    };
    const win = getWindow();
    const doc = getDocument();
    const RO = win
      ? (
          win as unknown as {
            ResizeObserver: unknown;
          }
        ).ResizeObserver
      : undefined;
    const ro =
      RO && typeof RO === "function"
        ? new (RO as new (callback: () => void) => ResizeObserver)(() =>
            requestAnimationFrame(recalc)
          )
        : null;
    recalc();
    if (ro) {
      if (outerElement) ro.observe(outerElement);
      if (gridElement) ro.observe(gridElement);
      if (doc) ro.observe(doc.documentElement);
    } else if (win) {
      win.addEventListener("resize", recalc);
    }
    return () => {
      if (ro) {
        try {
          if (outerElement) ro.unobserve(outerElement);
          if (gridElement) ro.unobserve(gridElement);
          if (doc) ro.unobserve(doc.documentElement);
        } catch {
          // Ignore errors when cleaning up ResizeObserver
        }
      } else if (win) {
        win.removeEventListener("resize", recalc);
      }
    };
  }, [stepCount]);

  return { outerRef, gridRef, scale };
}

export function getOnboardingHeaderConnectorLayout(
  outerRef: RefObject<HTMLDivElement | null>,
  stepCount: number
) {
  const outer = outerRef.current;
  if (!outer) {
    return {
      columnGap: 8,
      rowGap: 4,
      showConnectors: true,
      connectorWidth: "70%",
      connectorMargin: "15%",
    };
  }
  const availableWidth = outer.clientWidth;
  const minIconWidth = 20;
  const minSpaceForIcons = stepCount * minIconWidth;
  const showConnectors = availableWidth > minSpaceForIcons * 1.5;
  return {
    columnGap: 8,
    rowGap: 4,
    showConnectors,
    connectorWidth: "70%",
    connectorMargin: "15%",
  };
}
