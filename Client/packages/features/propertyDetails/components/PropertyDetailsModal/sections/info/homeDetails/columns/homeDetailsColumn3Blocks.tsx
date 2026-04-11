import React from "react";

import { CompactSchoolCard } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/homeDetails/CompactSchoolCard";
import {
  deduplicateFeatures,
  isImageFeatures,
} from "packages/features/propertyDetails/utils/propertyFeaturesHelpers";
import { Box } from "packages/ui/components/primitives";

import {
  asStringList,
  hoaLine,
  joinUnique,
  normalizeExteriorFeatures,
} from "./homeDetailsColumnHelpers";
import type {
  HomeDetailsBlock,
  HomeDetailsTranslate,
} from "./homeDetailsColumnTypes";

export function buildHomeDetailsColumn3Blocks(
  property: Record<string, unknown>,
  t: HomeDetailsTranslate,
): HomeDetailsBlock[] {
  const col3: HomeDetailsBlock[] = [];

  // Add AI-detected features at the top of column 3
  const imageFeatures = property.image_features;
  if (isImageFeatures(imageFeatures) && !imageFeatures.error) {
    const deduplicated = deduplicateFeatures(imageFeatures.clean);
    if (deduplicated.length > 0) {
      col3.push({
        id: "ai-detected-features",
        icon: "sparkles",
        title: t("property_details.ai_detected_features", {
          defaultValue: "AI-Detected Features",
        }),
        lines: deduplicated,
      });
    }
  }

  const schools = property.schools;
  const hasSchools = Array.isArray(schools) && schools.length > 0;
  if (hasSchools) {
    const schoolList = (schools as Array<Record<string, unknown>>).slice(0, 5);
    col3.push({
      id: "schools",
      icon: "graduation-cap",
      title: t("property_details.hd_schools", { defaultValue: "Schools" }),
      component: (
        <Box className="flex flex-col gap-2">
          {schoolList.map((school, idx) => (
            <CompactSchoolCard key={idx} school={school} />
          ))}
        </Box>
      ),
    });
  }

  const utilLines: string[] = asStringList(property.utilities, 12);
  const hoa = hoaLine(property, t);
  if (hoa) utilLines.unshift(hoa);
  if (utilLines.length > 0) {
    col3.push({
      id: "utilities",
      icon: "settings-2",
      title: t("property_details.hd_utilities", { defaultValue: "Utilities" }),
      lines: utilLines,
    });
  }

  const heatCool: string[] = [];
  const heating = asStringList(property.heating, 6);
  const cooling = asStringList(property.cooling, 6);
  if (heating.length > 0) {
    heatCool.push(
      t("property_details.hd_heating_line", {
        items: heating.join(", "),
        defaultValue: "Heating: {{items}}",
      }),
    );
  }
  if (cooling.length > 0) {
    heatCool.push(
      t("property_details.hd_cooling_line", {
        items: cooling.join(", "),
        defaultValue: "Cooling: {{items}}",
      }),
    );
  }
  if (heatCool.length > 0) {
    col3.push({
      id: "heat-cool",
      icon: "activity",
      title: t("property_details.hd_heating_cooling", {
        defaultValue: "Heating & Cooling",
      }),
      lines: heatCool,
    });
  }

  const poolFeatures = asStringList(property.pool, 6);
  if (poolFeatures.length > 0) {
    col3.push({
      id: "pool",
      icon: "droplets",
      title: t("property_details.hd_pool", { defaultValue: "Pool" }),
      lines: poolFeatures,
    });
  }

  const fencing = property.fencing;
  if (typeof fencing === "string" && fencing.trim()) {
    col3.push({
      id: "fencing",
      icon: "fence",
      title: t("property_details.hd_fencing", { defaultValue: "Fencing" }),
      lines: [fencing.trim()],
    });
  }

  const securityFeatures = asStringList(property.securityFeatures, 8);
  if (securityFeatures.length > 0) {
    col3.push({
      id: "security",
      icon: "shield",
      title: t("property_details.hd_security", { defaultValue: "Security" }),
      lines: securityFeatures,
    });
  }

  const fireplaceFeatures = asStringList(property.fireplaceFeatures, 6);
  if (fireplaceFeatures.length > 0) {
    col3.push({
      id: "fireplace",
      icon: "flame",
      title: t("property_details.hd_fireplace", { defaultValue: "Fireplace" }),
      lines: fireplaceFeatures,
    });
  }

  const extra = joinUnique(
    [
      ...normalizeExteriorFeatures(property.exteriorFeatures),
      ...asStringList(property.lotFeatures, 8),
      ...asStringList(property.communityFeatures, 8),
      ...asStringList(property.inclusions, 8),
    ],
    12,
  );
  if (extra.length > 0) {
    col3.push({
      id: "additional",
      icon: "sparkles",
      title: t("property_details.hd_additional_features", {
        defaultValue: "Additional Features",
      }),
      lines: extra,
    });
  }

  return col3;
}
