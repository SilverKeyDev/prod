import React from "react";
import { Home } from "lucide-react";
import { SectionBox, SectionTitle } from "./index";

type DebugSectionProps = {
  compsData: unknown;
  isLoading: boolean;
};

export function DebugSection({
  compsData,
  isLoading,
}: DebugSectionProps): React.JSX.Element | null {
  const hasValidComps =
    compsData &&
    typeof compsData === "object" &&
    "success" in compsData &&
    (compsData as { success: boolean }).success &&
    "data" in compsData &&
    (compsData as { data: unknown }).data &&
    typeof (compsData as { data: unknown }).data === "object" &&
    "comps" in (compsData as { data: Record<string, unknown> }).data;

  // Only show debug if compsData exists but doesn't have valid structure
  if (!Boolean(compsData) || hasValidComps || isLoading) {
    return null;
  }

  return (
    <SectionBox>
      <SectionTitle icon={<Home className="mobile-icon-sm text-brown" />}>
        Property Comparables - Debug Response
      </SectionTitle>
      <div className="space-responsive-sm text-responsive-sm max-h-96 overflow-auto rounded-lg bg-gray-900 font-mono text-green-400">
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(compsData, null, 2)}
        </pre>
      </div>
    </SectionBox>
  );
}
