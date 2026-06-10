import { color } from "packages/design-tokens";

/** Match search map polygon band (searchMapPolygon* z-index). */
export const COMMUTE_NATIVE_POLYGON_INDIVIDUAL_Z = 1000;
export const COMMUTE_NATIVE_POLYGON_UNION_Z = 1001;

export const PROPERTY_COMMUTE_NATIVE_ROUTE_COLORS = [
  color("olive.DEFAULT"),
  color("brown.DEFAULT"),
  color("gold.DEFAULT"),
  color("blue.DEFAULT"),
  color("rose.DEFAULT"),
] as const;
