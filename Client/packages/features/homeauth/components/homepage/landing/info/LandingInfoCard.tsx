import { useAnimatedCounter } from "packages/features/homeauth/hooks/useAnimatedCounter";
import type { LandingInfoCard as LandingInfoCardContent } from "packages/features/homeauth/types/landingContent";
import { Icon } from "packages/ui/components/media/icons";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Title } from "@/components/ui";

type LandingInfoCardProps = LandingInfoCardContent & {
  inView: boolean;
};

const ANIM_CLASS: Record<LandingInfoCardContent["animDirection"], string> = {
  left: "motion-safe:-translate-x-9",
  right: "motion-safe:translate-x-9",
  up: "motion-safe:translate-y-7",
};

export function LandingInfoCard({
  icon,
  iconTintClass,
  iconBgClass,
  statTarget,
  statSuffix,
  statDelayMs,
  title,
  body,
  animDirection,
  inView,
}: LandingInfoCardProps) {
  const stat = useAnimatedCounter(statTarget, statSuffix, inView, statDelayMs);

  return (
    <Box
      className={`border-border rounded-xl border bg-neutral-100/85 p-5 backdrop-blur-sm motion-safe:transition-all motion-safe:duration-[550ms] motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        inView
          ? "translate-x-0 translate-y-0 opacity-100"
          : `opacity-0 ${ANIM_CLASS[animDirection]}`
      }`}
    >
      <Box
        className={`mb-3.5 flex h-10 w-10 items-center justify-center rounded-[10px] ${iconBgClass}`}
      >
        <Icon name={icon} size={20} className={iconTintClass} />
      </Box>
      <Title as="p" size="lg" className="!text-brand-primary mb-1.5 !font-serif leading-none">
        {stat}
      </Title>
      <BodyText as="p" size="sm" className="mb-1.5 font-semibold">
        {title}
      </BodyText>
      <BodyText as="p" size="xs" muted className="leading-relaxed">
        {body}
      </BodyText>
    </Box>
  );
}
