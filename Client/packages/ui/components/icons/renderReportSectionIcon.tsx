import React from "react";

import { Icon } from "@ui/icons";

import { getSectionIconName } from "packages/utils/propertyDetails/analysis/sectionIconNames";

export function renderReportSectionIcon(
  sectionKey: string,
  className: string = "h-5 w-5"
): React.ReactNode {
  const iconName = getSectionIconName(sectionKey);
  if (!iconName) {
    return <Icon name="check-circle" className={className} />;
  }
  return <Icon name={iconName} className={className} />;
}
