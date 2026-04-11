import type { SearchResult } from "packages/features/search/types";
import { getMatchScore } from "packages/features/search/types/result";
import type { ResultsOrderBy } from "packages/features/search/types/searchDisplay";
import { dateNow } from "packages/utils/date";

import {
  type DistanceAnchorInput,
  distanceKmForSort,
  type DistanceSortMode,
  resolveDistanceSortMode,
} from "./displaySortAnchor";

export function parsePriceForSort(
  price: string | number | undefined,
): number | null {
  if (price == null) return null;
  if (typeof price === "number" && Number.isFinite(price)) return price;
  const s = String(price).replace(/[^0-9.]/g, "");
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Approximate sort key: first numeric value in string; "acres" / "acre" → convert to sq ft.
 */
export function parseLotSizeForSort(
  lotSize: string | undefined,
): number | null {
  if (!lotSize || typeof lotSize !== "string") return null;
  const lower = lotSize.toLowerCase();
  const match = lotSize.match(/[\d,.]+/);
  if (!match) return null;
  const n = Number.parseFloat(match[0].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  if (lower.includes("acre")) {
    return n * 43560;
  }
  return n;
}

export function homeAgeYears(
  yearBuilt: number | undefined,
  referenceYear: number,
): number | null {
  if (yearBuilt == null || !Number.isFinite(yearBuilt)) return null;
  const y = Math.floor(yearBuilt);
  if (y < 1600 || y > referenceYear + 1) return null;
  return referenceYear - y;
}

function compareNullableAsc(
  a: number | null,
  b: number | null,
  nullsLast: boolean,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return nullsLast ? 1 : -1;
  if (b == null) return nullsLast ? -1 : 1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function compareNullableDesc(
  a: number | null,
  b: number | null,
  nullsLast: boolean,
): number {
  return compareNullableAsc(b, a, nullsLast);
}

export function sortSearchResults(
  results: SearchResult[],
  orderBy: ResultsOrderBy,
  distanceInput: DistanceAnchorInput,
  options?: { referenceYear?: number },
): SearchResult[] {
  if (results.length <= 1) return [...results];

  const referenceYear = options?.referenceYear ?? dateNow().year();
  const distanceMode: DistanceSortMode = resolveDistanceSortMode(distanceInput);

  const scoreKey = (p: SearchResult) => {
    const v = getMatchScore(p);
    return Number.isFinite(v) ? v : null;
  };

  const out = [...results];
  out.sort((x, y) => {
    let cmp = 0;
    switch (orderBy) {
      case "match_score":
        cmp = compareNullableDesc(scoreKey(x), scoreKey(y), true);
        break;
      case "price":
        cmp = compareNullableAsc(
          parsePriceForSort(x.price),
          parsePriceForSort(y.price),
          true,
        );
        break;
      case "distance": {
        const dx = distanceKmForSort(distanceMode, { lat: x.lat, lng: x.lng });
        const dy = distanceKmForSort(distanceMode, { lat: y.lat, lng: y.lng });
        if (distanceMode.type === "none") {
          cmp = compareNullableDesc(scoreKey(x), scoreKey(y), true);
        } else {
          cmp = compareNullableAsc(dx, dy, true);
        }
        break;
      }
      case "bedrooms":
        cmp = compareNullableDesc(x.bedrooms, y.bedrooms, true);
        break;
      case "bathrooms":
        cmp = compareNullableDesc(x.bathrooms, y.bathrooms, true);
        break;
      case "lot_size":
        cmp = compareNullableDesc(
          parseLotSizeForSort(x.lotSize),
          parseLotSizeForSort(y.lotSize),
          true,
        );
        break;
      case "home_age":
        cmp = compareNullableDesc(
          homeAgeYears(x.yearBuilt, referenceYear),
          homeAgeYears(y.yearBuilt, referenceYear),
          true,
        );
        break;
      default:
        cmp = 0;
    }
    if (cmp !== 0) return cmp;
    return x.id.localeCompare(y.id);
  });
  return out;
}
