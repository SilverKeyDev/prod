import React from "react";

import { Icon } from "@ui/icons";

import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import type { PropertyWithAnalysis } from "packages/types/property-analysis";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
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
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="alert-triangle" className="text-brown h-5 w-5" />
        <Title as="h3" size="lg" className="text-brown font-semibold">
          Pros & Cons
        </Title>
        {pros && cons && Math.abs(pros.length - cons.length) > 2 && (
          <div className="ml-auto flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
            {pros.length > cons.length ? "More pros" : "More cons"}
          </div>
        )}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card
          className={`p-3 sm:p-4 ${
            pros && cons && pros.length > cons.length + 2
              ? "bg-green-50/30 ring-1 ring-green-200"
              : ""
          }`}
        >
          <Title
            as="h4"
            size="sm"
            className="mb-3 flex items-center gap-2 font-medium text-gray-600"
          >
            <Icon name="check-circle" className="h-4 w-4 flex-shrink-0 text-green-600" />
            Pros
            {pros && (
              <BodyText as="span" className="ml-1 text-xs text-gray-500">
                ({pros.length})
              </BodyText>
            )}
          </Title>
          <div className="space-y-3 text-left">
            {pros && pros.length > 0 ? (
              pros.map((pro: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-left text-sm text-gray-700">
                  <Icon
                    name="check-circle"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                  />
                  <BodyText as="span" className="text-left">
                    {pro}
                  </BodyText>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-left text-sm text-gray-500">
                <Icon name="check-circle" className="h-4 w-4 flex-shrink-0" />
                No pros identified
              </div>
            )}
          </div>
        </Card>

        <Card
          className={`p-3 sm:p-4 ${
            pros && cons && cons.length > pros.length + 2
              ? "bg-rose-50/30 ring-1 ring-rose-100"
              : ""
          }`}
        >
          <Title
            as="h4"
            size="sm"
            className="mb-3 flex items-center gap-2 font-medium text-gray-600"
          >
            <Icon name="alert-triangle" className="h-4 w-4 flex-shrink-0 text-red-600" />
            Cons
            {cons && (
              <BodyText as="span" className="ml-1 text-xs text-gray-500">
                ({cons.length})
              </BodyText>
            )}
          </Title>
          <div className="space-y-3 text-left">
            {cons && cons.length > 0 ? (
              cons.map((con: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-left text-sm text-gray-700">
                  <Icon
                    name="alert-triangle"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600"
                  />
                  <BodyText as="span" className="text-left">
                    {con}
                  </BodyText>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-left text-sm text-gray-500">
                <Icon name="alert-triangle" className="h-4 w-4 flex-shrink-0" />
                No cons identified
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
