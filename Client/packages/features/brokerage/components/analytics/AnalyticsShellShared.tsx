import { Icon } from "@ui/icons";
import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import type { IconName } from "packages/ui/types/icons";

export function KpiCard({
  label,
  value,
  delta,
  iconName,
}: {
  label: string;
  value: string | number;
  delta?: string;
  iconName?: IconName;
}) {
  return (
    <Box className="border-border bg-background-surface rounded-xl border p-4">
      <Box className="mb-1 flex items-center gap-1.5">
        {iconName ? (
          <Icon name={iconName} className="text-text-secondary h-3.5 w-3.5 shrink-0" />
        ) : null}
        <BodyText size="xs" muted>
          {label}
        </BodyText>
      </Box>
      <Title size="lg">{value}</Title>
      {delta ? (
        <BodyText size="xs" muted className="mt-1">
          {delta}
        </BodyText>
      ) : null}
    </Box>
  );
}

export function SectionCard({
  title,
  children,
  iconName,
}: {
  title: string;
  children: ReactNode;
  iconName?: IconName;
}) {
  return (
    <Box className="border-border bg-background-surface rounded-xl border p-5">
      <Box className="mb-4 flex items-center gap-2">
        {iconName ? (
          <Icon name={iconName} className="text-text-secondary h-4 w-4 shrink-0" />
        ) : null}
        <Title size="sm" as="h3">
          {title}
        </Title>
      </Box>
      {children}
    </Box>
  );
}

export function SectionHeading({
  title,
  iconName,
  as = "h2",
}: {
  title: string;
  iconName?: IconName;
  as?: "h2" | "h3";
}) {
  return (
    <Box className="mb-4 flex items-center gap-2">
      {iconName ? <Icon name={iconName} className="text-text-secondary h-4 w-4 shrink-0" /> : null}
      <Title size="sm" as={as}>
        {title}
      </Title>
    </Box>
  );
}
