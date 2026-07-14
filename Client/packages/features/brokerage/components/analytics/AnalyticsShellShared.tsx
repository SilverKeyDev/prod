import { Icon } from "@ui/icons";
import type { ReactNode } from "react";

import {
  type DeltaTone,
  deltaToneColor,
} from "packages/features/brokerage/utils/analytics/analyticsTokens";
import {
  paceBarColor,
  paceProjectionLabel,
  projectedPacePercent,
} from "packages/features/brokerage/utils/analytics/paceProjection";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import type { IconName } from "packages/ui/types/icons";

function KpiSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const width = 72;
  const height = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = deltaToneColor(values[values.length - 1]! >= values[0]! ? "up" : "down");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 block"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  deltaTone,
  sparkline,
  iconName,
  valueColor,
}: {
  label: string;
  value: string | number;
  /** Legacy freeform subtitle (still supported). */
  delta?: string;
  deltaTone?: DeltaTone;
  sparkline?: number[];
  iconName?: IconName;
  /** Optional emphasis color for the primary value (e.g. leakage dollars). */
  valueColor?: string;
}) {
  const toneColor = deltaTone ? deltaToneColor(deltaTone) : undefined;

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
      <Title
        size="lg"
        className="tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Title>
      {delta ? (
        <BodyText
          size="xs"
          muted={!toneColor}
          className="mt-1 tabular-nums"
          style={toneColor ? { color: toneColor } : undefined}
        >
          {deltaTone === "up" ? "↑ " : deltaTone === "down" ? "↓ " : ""}
          {delta}
        </BodyText>
      ) : null}
      {sparkline && sparkline.length >= 2 ? <KpiSparkline values={sparkline} /> : null}
    </Box>
  );
}

export function PaceKpiCard({
  metricLabel,
  actualDisplay,
  targetDisplay,
  actual,
  target,
  iconName,
  unitIsPercent = false,
}: {
  /** Short metric name for copy, e.g. "Attach rate" or "Volume". */
  metricLabel: string;
  actualDisplay: string;
  targetDisplay: string;
  actual: number;
  target: number;
  iconName?: IconName;
  /** When true, copy uses "X% vs Y% target" instead of currency of currency. */
  unitIsPercent?: boolean;
}) {
  const pacePct = target > 0 ? Math.round((actual / target) * 100) : 0;
  const fillPct = Math.min(100, Math.max(0, pacePct));
  const barColor = paceBarColor(pacePct);
  const projected = projectedPacePercent(actual, target);
  const comparison = unitIsPercent
    ? `${metricLabel} ${actualDisplay} vs ${targetDisplay} target`
    : `${metricLabel} ${actualDisplay} vs ${targetDisplay} target`;

  return (
    <Box
      className="border-border bg-background-surface rounded-xl border p-4"
      data-testid="pace-kpi-card"
    >
      <Box className="mb-1 flex items-center gap-1.5">
        {iconName ? (
          <Icon name={iconName} className="text-text-secondary h-3.5 w-3.5 shrink-0" />
        ) : null}
        <BodyText size="xs" muted>
          {comparison}
        </BodyText>
      </Box>
      <Title size="lg" className="tabular-nums" style={{ color: barColor }}>
        {pacePct}%
      </Title>
      <Box
        className="bg-border-card-muted mt-3 h-2 w-full overflow-hidden rounded-full"
        aria-hidden
      >
        <Box
          className="h-full rounded-full transition-all"
          style={{ width: `${fillPct}%`, backgroundColor: barColor }}
        />
      </Box>
      <BodyText size="xs" muted className="mt-2 tabular-nums">
        {paceProjectionLabel(projected)}
      </BodyText>
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
