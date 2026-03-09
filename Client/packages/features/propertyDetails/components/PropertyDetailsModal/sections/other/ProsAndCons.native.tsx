import React from "react";

import { color, spacing } from "packages/design-tokens";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import type { PropertyWithAnalysis } from "packages/types/property-analysis";
import { Icon } from "packages/ui/components/primitives";
import { Box, Text } from "packages/ui/components/primitives";

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

export const ProsAndCons: React.FC<PropertyComponentProps> = ({ property }) => {
  const propertyWithAnalysis = property as PropertyWithAnalysis;
  const propertyAnalysis = propertyWithAnalysis.property_analysis;
  if (!propertyAnalysis) return null;
  const { pros } = propertyAnalysis;
  const { cons } = propertyAnalysis;
  if (!pros && !cons) return null;

  return (
    <Box className="p-6">
      <Box className="mb-4 flex-row items-center gap-2">
        <Icon name="alert-triangle" size={20} color={color("brown.DEFAULT")} />
        <Text className="text-brown text-lg font-semibold">Pros & Cons</Text>
        {pros && cons && Math.abs(pros.length - cons.length) > 2 && (
          <Box className="ml-auto rounded-full bg-yellow-50 px-2 py-1">
            <Text className="text-xs text-yellow-700">
              {pros.length > cons.length ? "More pros" : "More cons"}
            </Text>
          </Box>
        )}
      </Box>
      <Box className="mt-2 flex-row flex-wrap gap-4">
        <Box
          className={`border-beige/30 min-w-0 flex-1 rounded-lg border bg-white p-4 ${
            pros && cons && pros.length > cons.length + 2 ? "border-green-200 bg-green-50/30" : ""
          }`}
        >
          <Box className="mb-3 flex-row items-center gap-2">
            <Icon name="check-circle" size={16} color={color("green.DEFAULT")} />
            <Text className="text-sm font-medium text-gray-600">
              Pros
              {pros && <Text className="ml-1 text-xs text-gray-500"> ({pros.length})</Text>}
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
                  <Text className="flex-1 text-sm text-gray-700">{pro}</Text>
                </Box>
              ))
            ) : (
              <Box className="flex-row items-center gap-2">
                <Icon name="check-circle" size={16} color={color("neutral.400")} />
                <Text className="text-sm text-gray-500">No pros identified</Text>
              </Box>
            )}
          </Box>
        </Box>

        <Box
          className={`border-beige/30 min-w-0 flex-1 rounded-lg border bg-white p-4 ${
            pros && cons && cons.length > pros.length + 2 ? "border-rose-100 bg-rose-50/30" : ""
          }`}
        >
          <Box className="mb-3 flex-row items-center gap-2">
            <Icon name="alert-triangle" size={16} color={color("rose.800")} />
            <Text className="text-sm font-medium text-gray-600">
              Cons
              {cons && <Text className="ml-1 text-xs text-gray-500"> ({cons.length})</Text>}
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
                  <Text className="flex-1 text-sm text-gray-700">{con}</Text>
                </Box>
              ))
            ) : (
              <Box className="flex-row items-center gap-2">
                <Icon name="alert-triangle" size={16} color={color("neutral.400")} />
                <Text className="text-sm text-gray-500">No cons identified</Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
