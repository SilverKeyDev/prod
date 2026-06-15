import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export type PreferencesSaveStatus = "idle" | "saving" | "saved";

export type PreferencesSaveStatusRowProps = {
  saveStatus: PreferencesSaveStatus;
  savingLabel: string;
  savedLabel: string;
  /** Applied to the outer wrapper when saveStatus is not idle */
  className?: string;
};

export default function PreferencesSaveStatusRow({
  saveStatus,
  savingLabel,
  savedLabel,
  className = "",
}: PreferencesSaveStatusRowProps): React.ReactElement | null {
  if (saveStatus === "idle") {
    return null;
  }

  return (
    <Box className={className}>
      {saveStatus === "saving" && (
        <BodyText as="span" size="sm" className="text-text-secondary">
          {savingLabel}
        </BodyText>
      )}
      {saveStatus === "saved" && (
        <BodyText as="span" size="sm" className="text-accent flex flex-row items-center gap-1">
          <Icon name="check" className="h-4 w-4" />
          {savedLabel}
        </BodyText>
      )}
    </Box>
  );
}
