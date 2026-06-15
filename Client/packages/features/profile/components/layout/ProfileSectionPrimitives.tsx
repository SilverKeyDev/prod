import React from "react";

import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type ProfileSectionBodyProps = {
  children: React.ReactNode;
  className?: string;
};

type ProfileSectionGroupProps = {
  children: React.ReactNode;
  title?: React.ReactNode;
  withDivider?: boolean;
  className?: string;
  titleClassName?: string;
  /** When false, `title` is not rendered (outline / grouping only). Default true. */
  showHeading?: boolean;
};

type ProfileSectionCalloutProps = {
  children: React.ReactNode;
  className?: string;
};

export function ProfileSectionBody({ children, className = "" }: ProfileSectionBodyProps) {
  return <Box className={`space-y-6 ${className}`.trim()}>{children}</Box>;
}

export function ProfileSectionGroup({
  children,
  title,
  withDivider = false,
  className = "",
  titleClassName = "",
  showHeading = true,
}: ProfileSectionGroupProps) {
  return (
    <Box
      className={`${
        withDivider ? "border-border border-t pt-8" : ""
      } space-y-4 ${className}`.trim()}
    >
      {showHeading && title ? (
        <Title size="sm" as="h3" className={`text-base ${titleClassName}`.trim()}>
          {title}
        </Title>
      ) : null}
      {children}
    </Box>
  );
}

export function ProfileSectionCallout({ children, className = "" }: ProfileSectionCalloutProps) {
  return (
    <Box
      className={`border-border bg-background-surface rounded-lg border px-3 py-2 ${className}`.trim()}
    >
      <BodyText size="xs" muted>
        {children}
      </BodyText>
    </Box>
  );
}
