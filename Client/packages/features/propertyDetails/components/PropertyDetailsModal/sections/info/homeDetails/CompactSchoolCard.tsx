import React from "react";

import { useLocalization } from "packages/contexts";
import { PropertySectionRatingBadge } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/layout/PropertySectionRatingBadge";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

type School = {
  name?: string | null;
  level?: string | null;
  grades?: string | null;
  rating?: number | string | null;
  distance?: number | string | null;
};

type CompactSchoolCardProps = {
  school: School;
};

export const CompactSchoolCard: React.FC<CompactSchoolCardProps> = ({ school }) => {
  const { t } = useLocalization();

  const ratingRaw = school.rating;
  const ratingNum =
    typeof ratingRaw === "number"
      ? ratingRaw
      : typeof ratingRaw === "string"
        ? parseFloat(ratingRaw)
        : NaN;
  const hasRating = Number.isFinite(ratingNum);

  const distRaw = school.distance;
  const distStr = distRaw !== undefined && distRaw !== null ? String(distRaw) : "";
  const miSuffix = t("property_details.mi", { defaultValue: "mi" });

  return (
    <Box className="border-border-card bg-bg-card-subtle flex flex-row items-center justify-between gap-2 rounded-lg border p-2.5">
      <Box className="min-w-0 flex-1">
        <BodyText as="p" size="xs" className="text-text-primary font-semibold">
          {String(school.name ?? "")}
        </BodyText>
        <BodyText as="p" size="xs" className="text-text-secondary mt-0.5">
          {String(school.level ?? "")}
          {school.level && school.grades
            ? t("property_details.bullet_separator", {
                defaultValue: " • ",
              })
            : ""}
          {String(school.grades ?? "")}
        </BodyText>
      </Box>
      <Box className="flex shrink-0 flex-col items-end gap-1.5">
        {hasRating ? <PropertySectionRatingBadge rating={ratingNum} /> : null}
        {distStr !== "" ? (
          <Box className="border-border rounded-full border px-2 py-0.5">
            <BodyText as="span" size="xs" className="text-text-secondary font-medium">
              {distStr} {miSuffix}
            </BodyText>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
