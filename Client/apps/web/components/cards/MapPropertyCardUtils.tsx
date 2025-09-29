import { createRoot } from "react-dom/client";

import MapPropertyCard, { type MapPropertyCardProps } from "./MapPropertyCard";

// Helper function to render MapPropertyCard into a DOM element
export const renderMapPropertyCard = (
  container: HTMLElement,
  props: MapPropertyCardProps,
): void => {
  const root = createRoot(container);
  root.render(<MapPropertyCard {...props} />);
};
