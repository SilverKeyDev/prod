import type { components } from "packages/types/api.generated";

type ViewingRouteLeg = components["schemas"]["ViewingRouteLeg"];

export type ViewingRouteMapPreviewProps = {
  legs: ViewingRouteLeg[] | null | undefined;
};

/** Non-web: map preview not rendered. */
export function ViewingRouteMapPreview(_props: ViewingRouteMapPreviewProps) {
  return null;
}
