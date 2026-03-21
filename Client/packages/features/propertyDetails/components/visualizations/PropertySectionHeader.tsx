import React from "react";

import { Icon } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import type { IconName } from "packages/ui/types/icons";

export type PropertySectionHeaderProps = {
  iconName: IconName;
  title: string;
  subtitle?: string;
  /** Extra node on the right (e.g. link). */
  action?: React.ReactNode;
  className?: string;
};

export function PropertySectionHeader({
  iconName,
  title,
  subtitle,
  action,
  className = "",
}: PropertySectionHeaderProps): React.ReactElement {
  return (
    <Box
      className={`mb-4 flex min-w-0 flex-row items-start gap-2 ${className}`}
    >
      <Icon
        name={iconName}
        size={20}
        className="text-foreground mt-0.5 h-5 w-5 shrink-0"
        aria-hidden
      />
      <Box className="min-w-0 flex-1">
        <Box className="flex flex-row items-center justify-between gap-2">
          <Title
            as="h3"
            size="lg"
            className="text-foreground min-w-0 flex-1 font-semibold leading-snug"
          >
            {title}
          </Title>
          {action ? <Box className="shrink-0">{action}</Box> : null}
        </Box>
        {subtitle ? (
          <BodyText as="p" size="sm" className="text-text-secondary mt-1">
            {subtitle}
          </BodyText>
        ) : null}
      </Box>
    </Box>
  );
}
