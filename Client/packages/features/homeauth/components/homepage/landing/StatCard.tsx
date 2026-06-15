import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Title } from "@/components/ui";

export type StatCardSize = "md" | "lg";

export type StatCardProps = {
  value: string;
  label: string;
  size?: StatCardSize;
  className?: string;
};

const valueTitleSize: Record<StatCardSize, "lg" | "xl"> = {
  md: "lg",
  lg: "xl",
};

export function StatCard({ value, label, size = "md", className = "" }: StatCardProps) {
  return (
    <Box
      className={`bg-background-surface border-border rounded-lg border px-5 py-4 sm:px-6 sm:py-5 ${className}`}
    >
      <Title
        as="p"
        size={valueTitleSize[size]}
        className="!text-text-primary !font-sans font-light tracking-tight"
      >
        {value}
      </Title>
      <BodyText size="sm" muted className="mt-1 break-words">
        {label}
      </BodyText>
    </Box>
  );
}
