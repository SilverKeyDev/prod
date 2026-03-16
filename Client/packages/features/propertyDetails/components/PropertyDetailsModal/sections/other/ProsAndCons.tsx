import React from "react";

import { Icon } from "@ui/icons";

import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import type { PropertyWithAnalysis } from "packages/types/property-analysis";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
export const ProsAndCons: React.FC<PropertyComponentProps> = ({ property }) => {
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
  return (
    <Box className="p-6">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon name="alert-triangle" className="text-foreground h-5 w-5" />
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          Pros & Cons
        </Title>
        {pros && cons && Math.abs(pros.length - cons.length) > 2 && (
          <Box className="ml-auto flex flex-row items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
            {pros.length > cons.length ? "More pros" : "More cons"}
          </Box>
        )}
      </Box>
      <Box className="grid-responsive-1-lg-2 mt-2">
        <Card
          // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
          className={`p-3 sm:p-4 ${pros && cons && pros.length > cons.length + 2 ? "bg-green-50 ring-1 ring-green-200" : ""}`}
        >
          <Title
            as="h4"
            size="sm"
            className="mb-3 flex flex-row items-center gap-2 font-medium text-gray-600"
          >
            <Icon name="check-circle" className="h-4 w-4 flex-shrink-0 text-green-600" />
            Pros
            {pros && (
              <BodyText as="span" className="ml-1 text-xs text-gray-500">
                ({pros.length})
              </BodyText>
            )}
          </Title>
          <Box className="flex flex-col gap-3 text-left">
            {pros && pros.length > 0 ? (
              pros.map((pro: string, i: number) => (
                <Box
                  key={i}
                  className="flex flex-row items-start gap-2 text-left text-sm text-gray-700"
                >
                  <Icon
                    name="check-circle"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                  />
                  <BodyText as="span" className="text-left">
                    {pro}
                  </BodyText>
                </Box>
              ))
            ) : (
              <Box className="flex flex-row items-center gap-2 text-left text-sm text-gray-500">
                <Icon name="check-circle" className="h-4 w-4 flex-shrink-0" />
                No pros identified
              </Box>
            )}
          </Box>
        </Card>

        <Card
          // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
          className={`p-3 sm:p-4 ${pros && cons && cons.length > pros.length + 2 ? "bg-rose-50 ring-1 ring-rose-100" : ""}`}
        >
          <Title
            as="h4"
            size="sm"
            className="mb-3 flex flex-row items-center gap-2 font-medium text-gray-600"
          >
            <Icon name="alert-triangle" className="h-4 w-4 flex-shrink-0 text-red-600" />
            Cons
            {cons && (
              <BodyText as="span" className="ml-1 text-xs text-gray-500">
                ({cons.length})
              </BodyText>
            )}
          </Title>
          <Box className="flex flex-col gap-3 text-left">
            {cons && cons.length > 0 ? (
              cons.map((con: string, i: number) => (
                <Box
                  key={i}
                  className="flex flex-row items-start gap-2 text-left text-sm text-gray-700"
                >
                  <Icon
                    name="alert-triangle"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600"
                  />
                  <BodyText as="span" className="text-left">
                    {con}
                  </BodyText>
                </Box>
              ))
            ) : (
              <Box className="flex flex-row items-center gap-2 text-left text-sm text-gray-500">
                <Icon name="alert-triangle" className="h-4 w-4 flex-shrink-0" />
                No cons identified
              </Box>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
};
