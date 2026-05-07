import { startTransition } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";

import { queryClient } from "packages/config/query/queryClient";
import { LocalizationProvider } from "packages/contexts";
import { log, LOG_CATEGORIES } from "packages/logger";

import MapPropertyCard, { type MapPropertyCardProps } from "./MapPropertyCard";

// Store React roots to manage them properly
const rootMap = new WeakMap<HTMLElement, Root>();

// Helper function to render MapPropertyCard into a DOM element.
// Uses startTransition so React treats each marker render as a non-urgent update
// and can yield to the browser between markers. This prevents the main-thread
// blocking (~900–1800 ms violations) that occurred when flushSync was used to
// render all markers synchronously in sequence.
// Note: Google Maps may later wrap the container with `content-visibility: auto`,
// which can produce a "Rendering in subtree hidden by content-visibility" console
// warning. That warning is cosmetic and does not affect correctness or rendering.
export const renderMapPropertyCard = (
  container: HTMLElement,
  props: MapPropertyCardProps,
  onCardRendered?: (property: MapPropertyCardProps["property"]) => void
): void => {
  // Clean up existing root if it exists
  const existingRoot = rootMap.get(container);
  if (existingRoot) {
    try {
      existingRoot.unmount();
    } catch (error) {
      log.warn(
        LOG_CATEGORIES.MAP_RENDERING,
        "Error unmounting existing MapPropertyCard root",
        error
      );
    }
    rootMap.delete(container);
  }

  // Create new root and store it
  const root = createRoot(container);
  rootMap.set(container, root);

  // Render the component with the callback and a unique key to force proper updates.
  // Include external contextKey (e.g., activeTab) to remount once per context change.
  const componentKey = `${props.property.id}-${props.isSaved ? "saved" : "unsaved"}-${props.showScore ? "scored" : "unscored"}-${props.contextKey ?? ""}`;
  startTransition(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider>
          <MapPropertyCard key={componentKey} {...props} onCardRendered={onCardRendered} />
        </LocalizationProvider>
      </QueryClientProvider>
    );
  });
};

// Helper function to clean up React root for a container
export const cleanupMapPropertyCard = (container: HTMLElement): void => {
  const root = rootMap.get(container);
  if (root) {
    // Defer unmount to avoid race condition with React's rendering cycle
    // Use setTimeout to ensure unmount happens after current render completes
    setTimeout(() => {
      try {
        root.unmount();
        rootMap.delete(container);
      } catch (error) {
        log.warn(LOG_CATEGORIES.MAP_RENDERING, "Error during MapPropertyCard cleanup", error);
        // Still remove from map even if unmount fails
        rootMap.delete(container);
      }
    }, 0);
  }
};
