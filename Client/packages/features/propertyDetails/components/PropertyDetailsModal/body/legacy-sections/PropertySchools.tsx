import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";

export const PropertySchools: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { t } = useLocalization();
  const { schools } = property as unknown as {
    schools: unknown;
  };
  if (!schools || !Array.isArray(schools) || schools.length === 0) {
    return null;
  }
  const schoolList = schools as Array<Record<string, unknown>>;
  return (
    <Box>
      <Box className="mb-4 flex items-center gap-2">
        <Icon name="graduation-cap" className="text-text-secondary h-5 w-5" />
        <Title as="h3" size="lg" className="text-text-secondary font-semibold">
          {t("property_details.nearby_schools")}
        </Title>
      </Box>

      <Card border="light" className="p-4">
        <Box className="space-y-3">
          {schoolList.slice(0, 6).map((school, idx) => (
            <Box key={idx} className="flex items-center justify-between">
              <Box className="flex-1">
                <Box className="text-text-secondary font-medium">
                  {school.name as string}
                </Box>
                <Box className="text-text-secondary text-sm">
                  {school.level as string}
                  {t("property_details.bullet_separator")}
                  {school.grades as string}
                </Box>
              </Box>
              <Box className="text-right">
                <Box className="text-text-secondary text-sm font-medium">
                  {school.rating as number}
                  {t("property_details.rating_out_of")}
                </Box>
                <Box className="text-text-secondary text-xs">
                  {school.distance as number} {t("property_details.mi")}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  );
};
