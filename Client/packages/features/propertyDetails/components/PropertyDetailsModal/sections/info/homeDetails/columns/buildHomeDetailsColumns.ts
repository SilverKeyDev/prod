import { getPropertyBasicFields } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";

import { buildHomeDetailsColumn1Blocks } from "./homeDetailsColumn1Blocks";
import { buildHomeDetailsColumn2Blocks } from "./homeDetailsColumn2Blocks";
import { buildHomeDetailsColumn3Blocks } from "./homeDetailsColumn3Blocks";
import type { HomeDetailsBlock, HomeDetailsTranslate } from "./homeDetailsColumnTypes";

/**
 * Builds three columns of “Home details” blocks (Homes.com–style grouping).
 */
export function buildHomeDetailsColumns(
  property: Record<string, unknown>,
  t: HomeDetailsTranslate
): [HomeDetailsBlock[], HomeDetailsBlock[], HomeDetailsBlock[]] {
  const fields = getPropertyBasicFields(property);
  return [
    buildHomeDetailsColumn1Blocks(property, fields, t),
    buildHomeDetailsColumn2Blocks(property, fields, t),
    buildHomeDetailsColumn3Blocks(property, t),
  ];
}

export function countHomeDetailsBlocks(
  cols: readonly [HomeDetailsBlock[], HomeDetailsBlock[], HomeDetailsBlock[]]
): number {
  return cols[0].length + cols[1].length + cols[2].length;
}
