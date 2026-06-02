import React from "react";

import { GraduationCap } from "lucide-react";

import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

import type { PropertyComponentProps } from "./types";

export const PropertySchools: React.FC<PropertyComponentProps> = ({ property }) => {
  const { schools } = property as unknown as { schools: unknown };

  if (!schools || !Array.isArray(schools) || schools.length === 0) {
    return null;
  }

  const schoolList = schools as Array<Record<string, unknown>>;

  return (
    <Box>
      <Box className="mb-4 flex flex-row items-center gap-2">
        <GraduationCap className="h-5 w-5 text-gray-600" />
        <Title as="h3" size="sm" className="text-brown text-lg font-semibold">
          Nearby Schools
        </Title>
      </Box>

      <Card className="p-4">
        <Box className="flex flex-col gap-3">
          {schoolList.slice(0, 6).map((school, idx) => (
            <Box key={idx} className="flex flex-row items-center justify-between">
              <Box className="flex-1">
                <BodyText as="p" size="sm" className="text-brown font-medium">
                  {school.name as string}
                </BodyText>
                <BodyText as="p" size="sm" className="text-gray-600">
                  {school.level as string} • {school.grades as string}
                </BodyText>
              </Box>
              <Box className="text-right">
                <BodyText as="p" size="sm" className="text-brown font-medium">
                  {school.rating as number}/10
                </BodyText>
                <BodyText as="p" size="xs" className="text-gray-500">
                  {school.distance as number} mi
                </BodyText>
              </Box>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  );
};
