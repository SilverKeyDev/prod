import { useLayoutEffect, useState } from "react";

import { getScrollParents } from "packages/ui/components/form/dropdownScrollParents";
import { getWindow } from "packages/utils/platform";

type PortalPlacement = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function useDropdownPortalPlacement({
  isOpen,
  canPortalMenu,
  dropdownRef,
  menuPortalRef,
  menuPlacement,
  desiredMenuHeightPx,
  filteredOptionsLength,
  registerOutsideClickSafeTarget,
}: {
  isOpen: boolean;
  canPortalMenu: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  menuPortalRef: React.RefObject<HTMLDivElement | null>;
  menuPlacement: "below" | "above";
  desiredMenuHeightPx: number;
  filteredOptionsLength: number;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
}) {
  const [portalPlacement, setPortalPlacement] =
    useState<PortalPlacement | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !canPortalMenu) {
      setPortalPlacement(null);
      return;
    }
    const root = dropdownRef.current;
    const win = getWindow();
    if (!root || !win) {
      setPortalPlacement(null);
      return;
    }

    const updatePlacement = () => {
      const rect = root.getBoundingClientRect();
      const margin = 12;
      const gap = 4;
      if (menuPlacement === "above") {
        const availAbove = Math.max(0, rect.top - margin - gap);
        const viewportBudget = Math.min(320, Math.max(48, availAbove));
        const maxHeight = Math.min(viewportBudget, desiredMenuHeightPx);
        let top = rect.top - maxHeight - gap;
        if (top < margin) {
          top = margin;
        }
        setPortalPlacement({
          top,
          left: rect.left,
          width: Math.max(rect.width, 200),
          maxHeight,
        });
      } else {
        const availBelow = Math.max(
          0,
          win.innerHeight - rect.bottom - margin - gap,
        );
        const viewportBudget = Math.min(320, Math.max(48, availBelow));
        const maxHeight = Math.min(viewportBudget, desiredMenuHeightPx);
        setPortalPlacement({
          top: rect.bottom + gap,
          left: rect.left,
          width: Math.max(rect.width, 200),
          maxHeight,
        });
      }
    };

    updatePlacement();

    const scrollParents = getScrollParents(root);
    const onScrollOrResize = () => {
      updatePlacement();
    };
    scrollParents.forEach((el) =>
      el.addEventListener("scroll", onScrollOrResize, { passive: true }),
    );
    win.addEventListener("resize", onScrollOrResize);
    win.addEventListener("scroll", onScrollOrResize, true);

    const ro = new ResizeObserver(updatePlacement);
    ro.observe(root);

    return () => {
      scrollParents.forEach((el) =>
        el.removeEventListener("scroll", onScrollOrResize),
      );
      win.removeEventListener("resize", onScrollOrResize);
      win.removeEventListener("scroll", onScrollOrResize, true);
      ro.disconnect();
      setPortalPlacement(null);
    };
  }, [
    isOpen,
    canPortalMenu,
    filteredOptionsLength,
    menuPlacement,
    desiredMenuHeightPx,
    dropdownRef,
  ]);

  useLayoutEffect(() => {
    if (!registerOutsideClickSafeTarget || !isOpen || !canPortalMenu) {
      return;
    }
    const el = menuPortalRef.current;
    if (!el) {
      return;
    }
    return registerOutsideClickSafeTarget(el);
  }, [
    isOpen,
    canPortalMenu,
    registerOutsideClickSafeTarget,
    portalPlacement,
    menuPortalRef,
  ]);

  return portalPlacement;
}
