import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

export function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: string;
}) {
  return (
    <Box className="border-border bg-background-surface rounded-xl border p-4">
      <BodyText size="xs" muted>
        {label}
      </BodyText>
      <Title size="lg">{value}</Title>
      {delta ? (
        <BodyText size="xs" muted className="mt-1">
          {delta}
        </BodyText>
      ) : null}
    </Box>
  );
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box className="border-border bg-background-surface rounded-xl border p-5">
      <Title size="sm" as="h3" className="mb-4">
        {title}
      </Title>
      {children}
    </Box>
  );
}
