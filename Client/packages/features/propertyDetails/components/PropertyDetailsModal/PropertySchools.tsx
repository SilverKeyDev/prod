import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { Title } from "packages/ui/components/index.web";

import Card from "@/components/layout/Card.web";

import type { PropertyComponentProps } from "./types";
export const PropertySchools: React.FC<PropertyComponentProps> = ({ property }) => {
  const { t } = useLocalization();
  const { schools } = property as unknown as {
    schools: unknown;
  };
  if (!schools || !Array.isArray(schools) || schools.length === 0) {
    return null;
  }
  const schoolList = schools as Array<Record<string, unknown>>;
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Icon name="graduation-cap" className="h-5 w-5 text-gray-600" />
        <Title as="h3" size="lg" className="text-brown font-semibold">
          {t("property_details.nearby_schools")}
        </Title>
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          {schoolList.slice(0, 6).map((school, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-brown font-medium">{school.name as string}</div>
                <div className="text-sm text-gray-600">
                  {school.level as string}
                  {t("property_details.bullet_separator")}
                  {school.grades as string}
                </div>
              </div>
              <div className="text-right">
                <div className="text-brown text-sm font-medium">
                  {school.rating as number}
                  {t("property_details.rating_out_of")}
                </div>
                <div className="text-xs text-gray-500">
                  {school.distance as number} {t("property_details.mi")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
