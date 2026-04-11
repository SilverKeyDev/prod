import React from "react";

import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { PropertySectionHeader } from "packages/features/propertyDetails/components/visualizations";
import { useProsAndConsData } from "packages/features/propertyDetails/hooks/useProsAndConsData";
import { Icon } from "packages/ui/components/icons";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { ProsConsStarRow } from "packages/ui/components/ui/ProsConsStarRow";

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

  if (!propertyAnalysis) {
    return null;
  }
  if (!prosList.length && !consList.length) {
    return null;
  }

  const itemTextSize = isAgent ? "md" : "sm";

  const strengthsBlock =
    prosList.length > 0 ? (
      <Box className="flex flex-col gap-3">
        <Title as="h4" size="sm" className="text-text-secondary font-medium">
          {t("property_details.highlights_strengths", {
            defaultValue: "Strengths",
          })}
        </Title>
        {prosList.map((pro, i) => (
          <Box
            key={i}
            className="text-text-secondary flex flex-row items-start gap-3 text-left"
          >
            <Icon
              name="check-circle"
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-700"
              aria-hidden
            />
            <Box className="flex min-w-0 flex-1 flex-col gap-1">
              <BodyText as="span" size={itemTextSize} className="text-left">
                {pro.text}
              </BodyText>
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
      <Box className="flex flex-col gap-3">
        <Title as="h4" size="sm" className="text-text-secondary font-medium">
          {t("property_details.highlights_tradeoffs", {
            defaultValue: "Tradeoffs",
          })}
        </Title>
        {consList.map((con, i) => {
          const isRedFlag = con.severity === "red_flag";
          return (
            <Box
              key={i}
              className="text-text-secondary flex flex-row items-start gap-3 text-left"
            >
              {isRedFlag ? (
                <Icon
                  name="flag"
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-800"
                  aria-hidden
                />
              ) : (
                <Icon
                  name="alert-triangle"
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-700"
                  aria-hidden
                />
              )}
              <Box className="flex min-w-0 flex-1 flex-col gap-1">
                <BodyText as="span" size={itemTextSize} className="text-left">
                  {con.text}
                </BodyText>
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
      <Box className="border-border bg-background-surface mt-4 flex flex-col gap-6 rounded-lg border p-4 sm:p-5">
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
