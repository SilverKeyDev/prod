import React from "react";

import { color, spacing } from "packages/design-tokens";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { useProsAndConsData } from "packages/features/propertyDetails/hooks/useProsAndConsData";
import { Box, Icon, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { ProsConsStarRow } from "packages/ui/components/ui/ProsConsStarRow";

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

export const ProsAndCons: React.FC<PropertyComponentProps> = ({ property }) => {
  const {
    contextLine,
    prosList,
    consList,
    highlightsSubtitle,
    propertyAnalysis,
    isAgent,
    t,
  } = useProsAndConsData(property);

  if (!propertyAnalysis) return null;
  if (!prosList.length && !consList.length) return null;

  const itemTextClass = isAgent
    ? "text-text-secondary flex-1 text-base"
    : "text-text-secondary flex-1 text-sm";
  const iconTop = { marginTop: spacingToNumber(spacing(0.5)) };

  const strengthsBlock =
    prosList.length > 0 ? (
      <Box className="gap-3">
        <Text className="text-text-secondary text-sm font-medium">
          {t("property_details.highlights_strengths", {
            defaultValue: "Strengths",
          })}
        </Text>
        {prosList.map((pro, i) => (
          <Box key={i} className="flex-row items-start gap-3">
            <Icon
              name="check-circle"
              size={16}
              color={color("green.700")}
              style={iconTop}
            />
            <Box className="min-w-0 flex-1 gap-1">
              <Text className={itemTextClass}>{pro.text}</Text>
              <ProsConsStarRow
                score={pro.score}
                variant="pro"
                ariaLabelKind="strength"
              />
            </Box>
          </Box>
        ))}
      </Box>
    ) : null;

  const tradeoffsBlock =
    consList.length > 0 ? (
      <Box className="gap-3">
        <Text className="text-text-secondary text-sm font-medium">
          {t("property_details.highlights_tradeoffs", {
            defaultValue: "Tradeoffs",
          })}
        </Text>
        {consList.map((con, i) => {
          const isRedFlag = con.severity === "red_flag";
          return (
            <Box key={i} className="flex-row items-start gap-3">
              <Icon
                name={isRedFlag ? "flag" : "alert-triangle"}
                size={16}
                color={isRedFlag ? color("rose.800") : color("yellow.800")}
                style={iconTop}
              />
              <Box className="min-w-0 flex-1 gap-1">
                <Text className={itemTextClass}>{con.text}</Text>
                <ProsConsStarRow
                  score={con.score}
                  variant={isRedFlag ? "con_red_flag" : "con_warning"}
                  ariaLabelKind="concern"
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    ) : null;

  return (
    <Box className="p-6">
      <PropertySectionHeader
        iconName="sparkles"
        title={t("property_details.highlights_heading", {
          defaultValue: "Highlights",
        })}
        subtitle={highlightsSubtitle}
      />
      {contextLine ? (
        <BodyText size="xs" muted className="text-text-secondary mt-1">
          {contextLine}
        </BodyText>
      ) : null}
      <Box className="border-border bg-background-surface mt-4 gap-6 rounded-lg border p-4">
        {isAgent ? (
          <>
            {tradeoffsBlock}
            {strengthsBlock}
          </>
        ) : (
          <>
            {strengthsBlock}
            {tradeoffsBlock}
          </>
        )}
      </Box>
    </Box>
  );
};
