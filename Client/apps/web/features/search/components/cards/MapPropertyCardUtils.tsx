import { createRoot, Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import MapPropertyCard, { type MapPropertyCardProps } from "./MapPropertyCard";
import { queryClient } from "../../../../../../packages/config/query/queryClient";

// Store React roots to manage them properly
const rootMap = new WeakMap<HTMLElement, Root>();

// Helper function to render MapPropertyCard into a DOM element
export const renderMapPropertyCard = (
  container: HTMLElement,
  props: MapPropertyCardProps,
  onCardRendered?: (property: MapPropertyCardProps["property"]) => void
): void => {
  // Clean up existing root if it exists
  const existingRoot = rootMap.get(container);
  if (existingRoot) {
    // Use immediate unmount for render function since we're replacing content
    try {
      existingRoot.unmount();
    } catch (error) {
      console.warn("Error unmounting existing MapPropertyCard root:", error);
    }
    rootMap.delete(container);
  }

  // Create new root and store it
  const root = createRoot(container);
  rootMap.set(container, root);

  // Render the component with the callback and a unique key to force proper updates
  // Include external contextKey (e.g., activeTab) to remount once per context change
  const componentKey = `${props.property.id}-${props.isSaved ? "saved" : "unsaved"}-${props.showScore ? "scored" : "unscored"}-${props.contextKey ?? ""}`;
  root.render(
    <QueryClientProvider client={queryClient}>
      <MapPropertyCard
        key={componentKey}
        {...props}
        onCardRendered={onCardRendered}
      />
    </QueryClientProvider>
  );
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
        console.warn("Error during MapPropertyCard cleanup:", error);
        // Still remove from map even if unmount fails
        rootMap.delete(container);
      }
    }, 0);
  }
};

