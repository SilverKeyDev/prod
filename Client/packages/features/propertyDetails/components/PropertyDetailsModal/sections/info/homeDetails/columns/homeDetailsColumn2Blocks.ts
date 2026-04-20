import type { PropertyBasicDisplayFields } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";

import {
  asStringList,
  formatParkingLines,
  joinUnique,
  laundryFromFeatures,
} from "./homeDetailsColumnHelpers";
import type { HomeDetailsBlock, HomeDetailsTranslate } from "./homeDetailsColumnTypes";

export function buildHomeDetailsColumn2Blocks(
  property: Record<string, unknown>,
  fields: PropertyBasicDisplayFields,
  t: HomeDetailsTranslate
): HomeDetailsBlock[] {
  const col2: HomeDetailsBlock[] = [];

  const appliances = asStringList(property.appliances, 12);
  if (appliances.length > 0) {
    col2.push({
      id: "kitchen",
      icon: "utensils-crossed",
      title: t("property_details.hd_kitchen", { defaultValue: "Kitchen" }),
      lines: appliances,
    });
  }

  const flooring = asStringList(property.flooring, 12);
  if (flooring.length > 0) {
    col2.push({
      id: "flooring",
      icon: "grid-3x3",
      title: t("property_details.hd_flooring", { defaultValue: "Flooring" }),
      lines: flooring,
    });
  }

  // Bedrooms and Bathrooms section removed per user request
  // const beds =
  //   fields.bedrooms != null && Number(fields.bedrooms) > 0 ? Number(fields.bedrooms) : undefined;
  // const baths =
  //   fields.bathrooms != null && Number(fields.bathrooms) > 0 ? Number(fields.bathrooms) : undefined;

  // const bathDetailLines: string[] = [];
  // const bf = property.bathroomsFull;
  // const bh = property.bathroomsHalf;
  // if (typeof bf === "number" && bf > 0) {
  //   bathDetailLines.push(
  //     t("property_details.hd_full_baths", {
  //       count: bf,
  //       defaultValue: "{{count}} full baths",
  //     })
  //   );
  // }
  // if (typeof bh === "number" && bh > 0) {
  //   bathDetailLines.push(
  //     t("property_details.hd_half_baths", {
  //       count: bh,
  //       defaultValue: "{{count}} half baths",
  //     })
  //   );
  // }
  // const bedBathLines: string[] = [];
  // if (beds !== undefined || baths !== undefined) {
  //   bedBathLines.push(
  //     t("property_details.hd_beds_baths", {
  //       beds: beds ?? "—",
  //       baths: baths ?? "—",
  //       defaultValue: "{{beds}} bed, {{baths}} bath",
  //     })
  //   );
  // }
  // bedBathLines.push(...bathDetailLines);
  // if (bedBathLines.length > 0) {
  //   col2.push({
  //     id: "bed-bath",
  //     icon: "bed",
  //     title: t("property_details.hd_bedrooms_bathrooms", {
  //       defaultValue: "Bedrooms and Bathrooms",
  //     }),
  //     lines: bedBathLines,
  //   });
  // }

  const interiorAll = asStringList(property.interiorFeatures, 50);
  const communityAll = asStringList(property.communityFeatures, 50);
  const laundryLines = joinUnique(
    [...laundryFromFeatures(interiorAll), ...laundryFromFeatures(communityAll)],
    8
  );
  if (laundryLines.length > 0) {
    col2.push({
      id: "laundry",
      icon: "settings",
      title: t("property_details.hd_laundry", { defaultValue: "Laundry" }),
      lines: laundryLines,
    });
  }

  const foundation = asStringList(property.foundationDetails, 8);
  if (foundation.length > 0) {
    col2.push({
      id: "basement",
      icon: "building",
      title: t("property_details.hd_basement_foundation", {
        defaultValue: "Basement & Foundation",
      }),
      lines: foundation,
    });
  }

  const parkingFeat = asStringList(property.parkingFeatures, 8);
  const parkingLines = formatParkingLines(t, fields.garageSpaces, fields.parking, parkingFeat);
  if (parkingLines.length > 0) {
    col2.push({
      id: "parking",
      icon: "square",
      title: t("property_details.hd_parking", { defaultValue: "Parking" }),
      lines: parkingLines,
    });
  }

  return col2;
}
