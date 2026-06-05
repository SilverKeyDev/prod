import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import SectionBox from "packages/features/negotiate/components/layout/SectionBox";
import SectionTitle from "packages/features/negotiate/components/layout/SectionTitle";
import { Box } from "packages/ui/components/structure/primitives";

type DebugSectionProps = {
  compsData: unknown;
  isLoading: boolean;
};
export function DebugSection({
  compsData,
  isLoading,
}: DebugSectionProps): React.JSX.Element | null {
  const { t } = useLocalization();
  const hasValidComps =
    compsData &&
    typeof compsData === "object" &&
    "success" in compsData &&
    (
      compsData as {
        success: boolean;
      }
    ).success &&
    "data" in compsData &&
    (
      compsData as {
        data: unknown;
      }
    ).data &&
    typeof (
      compsData as {
        data: unknown;
      }
    ).data === "object" &&
    "comps" in
      (
        compsData as {
          data: Record<string, unknown>;
        }
      ).data;
  // Only show debug if compsData exists but doesn't have valid structure
  if (!compsData || hasValidComps || isLoading) {
    return null;
  }
  return (
    <SectionBox>
      <SectionTitle icon={<Icon name="home" className="mobile-icon-sm text-text-secondary" />}>
        {t("negotiate.debug.section_title")}
      </SectionTitle>
      <Box className="space-responsive-sm text-responsive-sm bg-text-primary text-accent max-h-96 overflow-auto rounded-lg font-mono">
        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(compsData, null, 2)}</pre>
      </Box>
    </SectionBox>
  );
}
