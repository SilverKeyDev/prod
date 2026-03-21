import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import type { PropertyWithAnalysis } from "packages/types/property-analysis";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

export const ProsAndCons: React.FC<PropertyComponentProps> = ({ property }) => {
  const { t } = useLocalization();
  const propertyWithAnalysis = property as PropertyWithAnalysis;
  const propertyAnalysis = propertyWithAnalysis.property_analysis;
  if (!propertyAnalysis) {
    return null;
  }
  const { pros } = propertyAnalysis;
  const { cons } = propertyAnalysis;
  if (!pros && !cons) {
    return null;
  }

  const imbalancePill =
    pros && cons && Math.abs(pros.length - cons.length) > 2 ? (
      <Box className="flex flex-row items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-yellow-700">
        <BodyText as="span" size="xs" className="text-yellow-700">
          {t("property_details.pros_cons_balance", {
            pros: pros.length,
            cons: cons.length,
            defaultValue: "{{pros}} vs {{cons}}",
          })}
        </BodyText>
      </Box>
    ) : null;

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="alert-triangle"
        title={t("property_details.pros_cons_heading", {
          defaultValue: "Pros & Cons",
        })}
        action={imbalancePill}
      />
      <Box className="grid-responsive-1-lg-2 mt-2">
        <Card
          border="light"
          className={`p-3 sm:p-4 ${pros && cons && pros.length > cons.length + 2 ? "bg-green-50 ring-1 ring-green-200" : ""}`}
        >
          <Title
            as="h4"
            size="sm"
            className="text-text-secondary mb-3 flex flex-row items-center gap-2 font-medium"
          >
            <Icon
              name="check-circle"
              className="text-accent h-4 w-4 flex-shrink-0"
            />
            {t("property_details.pros_cons_pros", { defaultValue: "Pros" })}
            {pros && (
              <BodyText as="span" className="text-text-secondary ml-1 text-xs">
                ({pros.length})
              </BodyText>
            )}
          </Title>
          <Box className="flex flex-col gap-3 text-left">
            {pros && pros.length > 0 ? (
              pros.map((pro: string, i: number) => (
                <Box
                  key={i}
                  className="text-text-secondary flex flex-row items-start gap-2 text-left text-sm"
                >
                  <Icon
                    name="check-circle"
                    className="text-accent mt-0.5 h-4 w-4 flex-shrink-0"
                  />
                  <BodyText as="span" className="text-left">
                    {pro}
                  </BodyText>
                </Box>
              ))
            ) : (
              <Box className="text-text-secondary flex flex-row items-center gap-2 text-left text-sm">
                <Icon name="check-circle" className="h-4 w-4 flex-shrink-0" />
                {t("property_details.pros_cons_no_pros", {
                  defaultValue: "No pros identified",
                })}
              </Box>
            )}
          </Box>
        </Card>

        <Card
          border="light"
          className={`p-3 sm:p-4 ${pros && cons && cons.length > pros.length + 2 ? "bg-primary-muted ring-accent-muted ring-1" : ""}`}
        >
          <Title
            as="h4"
            size="sm"
            className="text-text-secondary mb-3 flex flex-row items-center gap-2 font-medium"
          >
            <Icon
              name="alert-triangle"
              className="text-destructive h-4 w-4 flex-shrink-0"
            />
            {t("property_details.pros_cons_cons", { defaultValue: "Cons" })}
            {cons && (
              <BodyText as="span" className="text-text-secondary ml-1 text-xs">
                ({cons.length})
              </BodyText>
            )}
          </Title>
          <Box className="flex flex-col gap-3 text-left">
            {cons && cons.length > 0 ? (
              cons.map((con: string, i: number) => (
                <Box
                  key={i}
                  className="text-text-secondary flex flex-row items-start gap-2 text-left text-sm"
                >
                  <Icon
                    name="alert-triangle"
                    className="text-destructive mt-0.5 h-4 w-4 flex-shrink-0"
                  />
                  <BodyText as="span" className="text-left">
                    {con}
                  </BodyText>
                </Box>
              ))
            ) : (
              <Box className="text-text-secondary flex flex-row items-center gap-2 text-left text-sm">
                <Icon name="alert-triangle" className="h-4 w-4 flex-shrink-0" />
                {t("property_details.pros_cons_no_cons", {
                  defaultValue: "No cons identified",
                })}
              </Box>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
};
