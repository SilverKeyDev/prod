import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PropertyDetailsSectionId } from "packages/features/propertyDetails/types/sectionOrder";
import { PROPERTY_DETAILS_SECTION_ORDER } from "packages/features/propertyDetails/types/sectionOrder";
import { getDocument, getWindow } from "packages/utils/core/platform";

export interface PropertyDetailsSectionRefs {
  overview: React.RefObject<HTMLElement>;
  location: React.RefObject<HTMLElement>;
  match: React.RefObject<HTMLElement>;
  analysis: React.RefObject<HTMLElement>;
}

export interface UsePropertyDetailsSectionScrollResult {
  activeSection: PropertyDetailsSectionId;
  sectionRefs: PropertyDetailsSectionRefs;
  scrollToSection: (sectionId: PropertyDetailsSectionId) => void;
}

/**
 * Custom hook that manages scroll-based navigation for property details sections.
 * Uses IntersectionObserver to track which section is currently visible and provides
 * smooth scrolling to sections when tabs are clicked.
 */
export function usePropertyDetailsSectionScroll(): UsePropertyDetailsSectionScrollResult {
  const [activeSection, setActiveSection] = useState<PropertyDetailsSectionId>("overview");

  // Create refs for each section
  const overviewRef = useRef<HTMLElement>(null);
  const locationRef = useRef<HTMLElement>(null);
  const matchRef = useRef<HTMLElement>(null);
  const analysisRef = useRef<HTMLElement>(null);

  const sectionRefs: PropertyDetailsSectionRefs = useMemo(
    () => ({
      overview: overviewRef,
      location: locationRef,
      match: matchRef,
      analysis: analysisRef,
    }),
    []
  );

  // Track which sections are currently intersecting
  const intersectingRef = useRef<Set<PropertyDetailsSectionId>>(new Set());

  // Scroll to a specific section
  const scrollToSection = useCallback(
    (sectionId: PropertyDetailsSectionId) => {
      const ref = sectionRefs[sectionId];
      if (!ref.current) return;

      // Find the scroll container (Cover modal's scrollable content area)
      const win = getWindow();
      if (!win) return;

      let scrollContainer: HTMLElement | null = ref.current.parentElement;
      while (scrollContainer) {
        const overflowY = win.getComputedStyle(scrollContainer).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") {
          break;
        }
        scrollContainer = scrollContainer.parentElement;
      }

      if (!scrollContainer) return;

      // Get the header height to offset scroll position
      const header = getDocument()?.querySelector("[data-property-header]");
      const headerHeight = header?.getBoundingClientRect().height ?? 0;

      // Calculate position relative to the scroll container
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = ref.current.getBoundingClientRect();
      const offsetPosition =
        elementRect.top - containerRect.top + scrollContainer.scrollTop - headerHeight - 16;

      scrollContainer.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    },
    [sectionRefs]
  );

  // Set up IntersectionObserver to track visible sections
  useEffect(() => {
    // Find the scroll container (Cover modal's scrollable content area)
    const firstRef = Object.values(sectionRefs)[0];
    if (!firstRef?.current) return;

    const win = getWindow();
    if (!win) return;

    const IntersectionObserverCtor = win.IntersectionObserver;
    if (!IntersectionObserverCtor) return;

    let scrollContainer: HTMLElement | null = firstRef.current.parentElement;
    while (scrollContainer) {
      const overflowY = win.getComputedStyle(scrollContainer).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        break;
      }
      scrollContainer = scrollContainer.parentElement;
    }

    if (!scrollContainer) return;

    const observerOptions: IntersectionObserverInit = {
      root: scrollContainer, // Use the scroll container as root instead of viewport
      rootMargin: "-80px 0px -50% 0px", // Top offset for header, bottom threshold at 50%
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute("data-section-id") as PropertyDetailsSectionId;
        if (!sectionId) return;

        if (entry.isIntersecting) {
          intersectingRef.current.add(sectionId);
        } else {
          intersectingRef.current.delete(sectionId);
        }
      });

      // Determine which section should be active based on the order of sections
      // Find the first intersecting section in order
      for (const sectionId of PROPERTY_DETAILS_SECTION_ORDER) {
        if (intersectingRef.current.has(sectionId)) {
          setActiveSection(sectionId);
          break;
        }
      }
    };

    const observer = new IntersectionObserverCtor(handleIntersection, observerOptions);

    // Observe all sections
    const refs = Object.values(sectionRefs);
    refs.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionRefs]);

  return {
    activeSection,
    sectionRefs,
    scrollToSection,
  };
}
