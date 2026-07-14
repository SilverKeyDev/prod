/**
 * Quant-style math strip: hero, collapsible methodology, stats, bridge.
 */
import { useState } from "react";

import type { QuantMathExplanation } from "packages/features/brokerage/utils/campaigns/quantMathExplanation";
import { Link } from "packages/navigation";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  explanation: QuantMathExplanation;
  /** Optional test id prefix for e2e / component tests. */
  testId?: string;
  /**
   * When true, methodology table starts expanded. Default false — collapsed
   * behind "Show methodology". Hero, stats, and bridge stay visible.
   */
  methodologyDefaultOpen?: boolean;
  /**
   * When true, omit the stats grid (e.g. Leakage Snapshot already owns those KPIs).
   * Hero, methodology, and bridge stay visible. Default false.
   */
  hideStats?: boolean;
};

export function QuantMathStrip({
  explanation,
  testId = "quant-math-strip",
  methodologyDefaultOpen = false,
  hideStats = false,
}: Props) {
  const { hero, formulaRows, formulaTotal, stats, bridge } = explanation;
  const [methodologyOpen, setMethodologyOpen] = useState(methodologyDefaultOpen);

  return (
    <Box className="flex w-full flex-col gap-5" data-testid={testId}>
      <Box className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
        <Box className="min-w-0 shrink-0 lg:w-56" data-testid={`${testId}-hero`}>
          <BodyText size="sm" muted className="mb-1">
            {hero.label}
          </BodyText>
          <Title
            size="xl"
            as="h2"
            className="tabular-nums"
            style={hero.valueColor ? { color: hero.valueColor } : undefined}
          >
            {hero.value}
          </Title>
          {hero.secondaryLabel || hero.secondaryValue ? (
            <Box className="mt-2">
              {hero.secondaryLabel ? (
                <BodyText size="xs" muted>
                  {hero.secondaryLabel}
                </BodyText>
              ) : null}
              {hero.secondaryValue ? (
                <BodyText size="sm" className="font-medium tabular-nums">
                  {hero.secondaryValue}
                </BodyText>
              ) : null}
            </Box>
          ) : null}
        </Box>

        <Box className="min-w-0 flex-1" data-testid={`${testId}-formula`}>
          <Box className="mb-2 flex items-center justify-between gap-3">
            <BodyText size="xs" muted className="font-medium uppercase tracking-wide">
              Methodology
            </BodyText>
            <Box data-testid={`${testId}-methodology-toggle`}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onPress={() => setMethodologyOpen((open) => !open)}
              >
                {methodologyOpen ? "Hide methodology" : "Show methodology"}
              </Button>
            </Box>
          </Box>

          {methodologyOpen ? (
            <Box data-testid={`${testId}-methodology-body`}>
              <Box className="border-border hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] gap-x-4 border-b pb-1.5 md:grid">
                <BodyText size="xs" muted className="font-medium">
                  Service
                </BodyText>
                <BodyText size="xs" muted className="font-medium">
                  Equation
                </BodyText>
              </Box>

              <Box className="divide-border flex flex-col divide-y">
                {formulaRows.map((row) => (
                  <Box
                    key={`${row.label}-${row.equation}`}
                    className="grid grid-cols-1 gap-1 py-2.5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] md:gap-x-4 md:gap-y-0"
                  >
                    <Box className="min-w-0">
                      <BodyText size="sm" className="font-medium">
                        {row.label}
                      </BodyText>
                      {row.inputs ? (
                        <BodyText size="xs" muted className="mt-0.5 tabular-nums">
                          {row.inputs}
                        </BodyText>
                      ) : null}
                    </Box>
                    <BodyText size="xs" className="tabular-nums leading-relaxed md:pt-0.5">
                      {row.equation}
                    </BodyText>
                  </Box>
                ))}
              </Box>

              {formulaTotal ? (
                <BodyText
                  size="sm"
                  className="border-border mt-1 border-t pt-2 font-semibold tabular-nums"
                >
                  {formulaTotal}
                </BodyText>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Box>

      {hideStats ? null : (
        <Box
          className="border-border grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 sm:grid-cols-3"
          data-testid={`${testId}-stats`}
        >
          {stats.map((stat) => (
            <Box key={stat.label} className="min-w-0">
              <BodyText size="xs" muted className="mb-0.5">
                {stat.label}
              </BodyText>
              <BodyText size="sm" className="font-semibold tabular-nums">
                {stat.value}
              </BodyText>
            </Box>
          ))}
        </Box>
      )}

      <Box data-testid={`${testId}-bridge`} className="flex flex-wrap items-baseline gap-1.5">
        <BodyText size="xs" muted>
          Next:
        </BodyText>
        <BodyText size="xs">
          <Link to={bridge.to} className="underline underline-offset-2">
            {bridge.label}
          </Link>
        </BodyText>
      </Box>
    </Box>
  );
}
