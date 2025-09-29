import { GraduationCap } from "lucide-react";
import React from "react";

import Card from "../../layout/Card";

import type { PropertyComponentProps } from "./types";

export const PropertySchools: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { schools } = property as unknown as { schools: unknown };

  if (!schools || !Array.isArray(schools) || schools.length === 0) {
    return null;
  }

  const schoolList = schools as Array<Record<string, unknown>>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-brown">Nearby Schools</h3>
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          {schoolList.slice(0, 6).map((school, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-brown">
                  {school.name as string}
                </div>
                <div className="text-sm text-gray-600">
                  {school.level as string} • {school.grades as string}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-brown">
                  {school.rating as number}/10
                </div>
                <div className="text-xs text-gray-500">
                  {school.distance as number} mi
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
