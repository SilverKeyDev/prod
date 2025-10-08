import { createRoot, Root } from "react-dom/client";

import MapPropertyCard, { type MapPropertyCardProps } from "./MapPropertyCard";

// Store React roots to manage them properly
const rootMap = new WeakMap<HTMLElement, Root>();

// Helper function to render MapPropertyCard into a DOM element
export const renderMapPropertyCard = (
  container: HTMLElement,
  props: MapPropertyCardProps
): void => {
  // Clean up existing root if it exists
  const existingRoot = rootMap.get(container);
  if (existingRoot) {
    existingRoot.unmount();
  }

  // Create new root and store it
  const root = createRoot(container);
  rootMap.set(container, root);

  // Render the component
  root.render(<MapPropertyCard {...props} />);
};

// Helper function to clean up React root for a container
export const cleanupMapPropertyCard = (container: HTMLElement): void => {
  const root = rootMap.get(container);
  if (root) {
    root.unmount();
    rootMap.delete(container);
  }
};
