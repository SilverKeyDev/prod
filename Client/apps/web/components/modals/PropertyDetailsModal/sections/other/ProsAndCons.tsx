import React from "react";

import { AlertTriangle, CheckCircle } from "lucide-react";

import type { PropertyWithAnalysis } from "packages/schemas/property";

import Card from "@/components/layout/Card.web";
import type { PropertyComponentProps } from "@/components/modals/PropertyDetailsModal/types";
import { BodyText, Title } from "@/components/ui/index.web";

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
        <AlertTriangle className="h-5 w-5 text-brown" />
        <Title as="h3" size="lg" className="font-semibold text-brown">
          Pros & Cons
        </Title>
        {pros && cons && Math.abs(pros.length - cons.length) > 2 && (
          <div className="ml-auto flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
            {pros.length > cons.length ? "More pros" : "More cons"}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 mt-2">
        <Card
          className={`p-3 sm:p-4 ${
            pros && cons && pros.length > cons.length + 2
              ? "ring-1 ring-green-200 bg-green-50/30"
              : ""
          }`}
        >
          <Title
            as="h4"
            size="sm"
            className="mb-3 flex items-center gap-2 font-medium text-gray-600"
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
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
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 text-left"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <BodyText as="span" className="text-left">
                    {pro}
                  </BodyText>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 text-left">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                No pros identified
              </div>
            )}
          </div>
        </Card>

        <Card
          className={`p-3 sm:p-4 ${
            pros && cons && cons.length > pros.length + 2
              ? "ring-1 ring-rose-100 bg-rose-50/30"
              : ""
          }`}
        >
          <Title
            as="h4"
            size="sm"
            className="mb-3 flex items-center gap-2 font-medium text-gray-600"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
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
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 text-left"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <BodyText as="span" className="text-left">
                    {con}
                  </BodyText>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 text-left">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                No cons identified
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
