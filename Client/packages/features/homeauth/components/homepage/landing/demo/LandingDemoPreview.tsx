import { useEffect, useState } from "react";

import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_DEMO_LAYOUT } from "packages/features/homeauth/utils/landingSectionLayout";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

import { LandingSectionShell } from "../shared/LandingSectionShell";

type DemoRevealKey = "dc1" | "dc2" | "dc3" | "dc4" | "dw1" | "dw2";

export function LandingDemoPreview() {
  const { demo } = LANDING_CONTENT;
  const maxTrend = Math.max(...demo.trendValues);
  const [shown, setShown] = useState<Record<DemoRevealKey, boolean>>({
    dc1: false,
    dc2: false,
    dc3: false,
    dc4: false,
    dw1: false,
    dw2: false,
  });

  useEffect(() => {
    const statIds: DemoRevealKey[] = ["dc1", "dc2", "dc3", "dc4"];
    const wideIds: DemoRevealKey[] = ["dw1", "dw2"];
    const timers: number[] = [];

    statIds.forEach((id, index) => {
      timers.push(
        window.setTimeout(
          () => {
            setShown((prev) => ({ ...prev, [id]: true }));
          },
          300 + index * 120
        )
      );
    });

    wideIds.forEach((id, index) => {
      timers.push(
        window.setTimeout(
          () => {
            setShown((prev) => ({ ...prev, [id]: true }));
          },
          800 + index * 100
        )
      );
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const cardReveal = (visible: boolean, delayClass = "") =>
    `motion-safe:transition-all motion-safe:duration-400 ${delayClass} ${
      visible
        ? "translate-y-0 opacity-100"
        : "translate-y-2.5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
    }`;

  return (
    <LandingSectionShell
      layout={LANDING_DEMO_LAYOUT}
      className="px-responsive-sm pb-16 pt-4"
      fullBleed
    >
      <Box className="border-border bg-background-base mx-auto max-w-[880px] overflow-hidden rounded-2xl border shadow-lg">
        <Box className="border-border bg-background-surface border-b px-4 py-3">
          <Box className="flex items-center gap-2">
            {["#D4C4A8", "#D4C4A8", "#D4C4A8"].map((dotColor) => (
              <Box
                key={dotColor}
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: dotColor }}
                aria-hidden
              />
            ))}
            <BodyText as="span" size="xs" muted className="ml-2 font-medium">
              {demo.windowTitle}
            </BodyText>
          </Box>
          <BodyText as="p" size="xs" muted className="mt-1 pl-[38px]">
            {demo.syncCaption}
          </BodyText>
        </Box>

        <Box className="grid min-w-0 grid-cols-2 gap-2.5 p-5 md:grid-cols-4">
          {demo.stats.map((card) => (
            <Box
              key={card.id}
              className={`border-border bg-background-surface min-w-0 rounded-lg border p-3.5 ${cardReveal(shown[card.id as DemoRevealKey])}`}
            >
              <BodyText
                as="p"
                size="xs"
                muted
                className="mb-2 font-semibold uppercase tracking-wider"
              >
                {card.label}
              </BodyText>
              <BodyText as="p" size="lg" className="!font-serif leading-none">
                {card.value}
              </BodyText>
              <BodyText as="p" size="xs" muted className="mt-1">
                {card.sub}
              </BodyText>
            </Box>
          ))}
        </Box>

        <Box className="grid grid-cols-1 gap-2.5 px-5 pb-5 md:grid-cols-2">
          <Box
            className={`border-border bg-background-surface rounded-lg border p-3.5 ${cardReveal(shown.dw1, "motion-safe:delay-150")}`}
          >
            <BodyText
              as="p"
              size="xs"
              muted
              className="mb-2.5 font-semibold uppercase tracking-wider"
            >
              {demo.queueHeading}
            </BodyText>
            {demo.queueItems.map((item) => (
              <Box
                key={item.name}
                className="border-border bg-background-base mb-1.5 rounded-md border px-2.5 py-2 last:mb-0"
              >
                <BodyText as="p" size="xs" className="font-medium">
                  {item.name}
                </BodyText>
                <BodyText as="p" size="xs" muted>
                  {item.opportunity}
                </BodyText>
              </Box>
            ))}
          </Box>

          <Box
            className={`border-border bg-background-surface rounded-lg border p-3.5 ${cardReveal(shown.dw2, "motion-safe:delay-250")}`}
          >
            <BodyText
              as="p"
              size="xs"
              muted
              className="mb-2.5 font-semibold uppercase tracking-wider"
            >
              {demo.trendHeading}
            </BodyText>
            <Box className="bg-accent-muted/60 rounded-lg px-2 pb-2 pt-3">
              <Box className="flex h-16 gap-1.5">
                {demo.trendValues.map((value, index) => {
                  const isLatest = index === demo.trendValues.length - 1;
                  const heightPercent = Math.max((value / maxTrend) * 100, 10);

                  return (
                    <Box
                      key={demo.trendMonths[index]}
                      className="flex min-w-0 flex-1 flex-col justify-end"
                    >
                      <Box
                        className={`w-full rounded-t-md ${
                          isLatest ? "bg-brand-primary" : "bg-primary-muted"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                        aria-hidden
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
            <Box
              className="mt-2 grid gap-1"
              style={{ gridTemplateColumns: `repeat(${demo.trendMonths.length}, 1fr)` }}
            >
              {demo.trendMonths.map((month, index) => {
                const isLatest = index === demo.trendMonths.length - 1;

                return (
                  <BodyText
                    key={month}
                    as="span"
                    size="xs"
                    muted={!isLatest}
                    className={`text-center ${isLatest ? "text-brand-primary font-semibold" : ""}`}
                  >
                    {month}
                  </BodyText>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </LandingSectionShell>
  );
}
