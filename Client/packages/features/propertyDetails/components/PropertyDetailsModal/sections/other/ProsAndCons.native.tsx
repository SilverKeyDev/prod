import React from "react";

import { useLocalization } from "packages/contexts";
import { color, spacing } from "packages/design-tokens";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import type { PropertyWithAnalysis } from "packages/types/property-analysis";
import { Icon } from "packages/ui/components/primitives";
import { Box, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

export const ProsAndCons: React.FC<PropertyComponentProps> = ({ property }) => {
  const { t } = useLocalization();
  const propertyWithAnalysis = property as PropertyWithAnalysis;
  const propertyAnalysis = propertyWithAnalysis.property_analysis;
  if (!propertyAnalysis) return null;
  const { pros } = propertyAnalysis;
  const { cons } = propertyAnalysis;
  if (!pros && !cons) return null;

  const imbalancePill =
    pros && cons && Math.abs(pros.length - cons.length) > 2 ? (
      <Box className="rounded-full bg-yellow-50 px-2 py-1">
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
      <Box className="mt-2 flex-row flex-wrap gap-4">
        <Box
          className={`border-border bg-background-surface min-w-0 flex-1 rounded-lg border p-4 ${
            pros && cons && pros.length > cons.length + 2
              ? "border-green-200 bg-green-50/30"
              : ""
          }`}
        >
          <Box className="mb-3 flex-row items-center gap-2">
            <Icon
              name="check-circle"
              size={16}
              color={color("green.DEFAULT")}
            />
            <Text className="text-text-secondary text-sm font-medium">
              {t("property_details.pros_cons_pros", { defaultValue: "Pros" })}
              {pros && (
                <Text className="text-text-secondary ml-1 text-xs">
                  {" "}
                  ({pros.length})
                </Text>
              )}
            </Text>
          </Box>
          <Box className="gap-3">
            {pros && pros.length > 0 ? (
              pros.map((pro: string, i: number) => (
                <Box key={i} className="flex-row items-start gap-2">
                  <Icon
                    name="check-circle"
                    size={16}
                    color={color("green.DEFAULT")}
                    style={{ marginTop: spacingToNumber(spacing(0.5)) }}
                  />
                  <Text className="text-text-secondary flex-1 text-sm">
                    {pro}
                  </Text>
                </Box>
              ))
            ) : (
              <Box className="flex-row items-center gap-2">
                <Icon
                  name="check-circle"
                  size={16}
                  color={color("neutral.400")}
                />
                <Text className="text-text-secondary text-sm">
                  {t("property_details.pros_cons_no_pros", {
                    defaultValue: "No pros identified",
                  })}
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        <Box
          className={`border-border bg-background-surface min-w-0 flex-1 rounded-lg border p-4 ${
            pros && cons && cons.length > pros.length + 2
              ? "border-destructive bg-primary-muted/30"
              : ""
          }`}
        >
          <Box className="mb-3 flex-row items-center gap-2">
            <Icon name="alert-triangle" size={16} color={color("rose.800")} />
            <Text className="text-text-secondary text-sm font-medium">
              {t("property_details.pros_cons_cons", { defaultValue: "Cons" })}
              {cons && (
                <Text className="text-text-secondary ml-1 text-xs">
                  {" "}
                  ({cons.length})
                </Text>
              )}
            </Text>
          </Box>
          <Box className="gap-3">
            {cons && cons.length > 0 ? (
              cons.map((con: string, i: number) => (
                <Box key={i} className="flex-row items-start gap-2">
                  <Icon
                    name="alert-triangle"
                    size={16}
                    color={color("rose.800")}
                    style={{ marginTop: spacingToNumber(spacing(0.5)) }}
                  />
                  <Text className="text-text-secondary flex-1 text-sm">
                    {con}
                  </Text>
                </Box>
              ))
            ) : (
              <Box className="flex-row items-center gap-2">
                <Icon
                  name="alert-triangle"
                  size={16}
                  color={color("neutral.400")}
                />
                <Text className="text-text-secondary text-sm">
                  {t("property_details.pros_cons_no_cons", {
                    defaultValue: "No cons identified",
                  })}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
