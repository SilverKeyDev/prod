import type { ReactNode } from "react";

import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import type {
  LandingSectionLayout,
  LandingSectionTone,
} from "packages/features/homeauth/utils/landingSectionLayout";
import { Box } from "packages/ui/components/structure/primitives";
import RippleBackground from "packages/ui/components/surfaces/backgrounds/RippleBackground";

import { LandingSectionDivider } from "./LandingSectionDivider";

type LandingSectionShellProps = {
  id?: string;
  as?: "section" | "footer";
  layout?: LandingSectionLayout;
  tone?: LandingSectionTone;
  ripple?: boolean;
  dividerBefore?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  fullBleed?: boolean;
};

const TONE_CLASS: Record<LandingSectionTone, string> = {
  base: "bg-background-base",
  surface: "bg-background-surface",
};

export function LandingSectionShell({
  id,
  as: Tag = "section",
  layout,
  tone,
  ripple,
  dividerBefore,
  children,
  className = "",
  contentClassName = "",
  fullBleed = false,
}: LandingSectionShellProps) {
  const resolvedTone = tone ?? layout?.tone ?? "base";
  const resolvedRipple = ripple ?? layout?.ripple ?? false;
  const resolvedDividerBefore = dividerBefore ?? layout?.dividerBefore ?? false;

  return (
    <Tag
      id={id}
      className={`relative overflow-hidden ${TONE_CLASS[resolvedTone]} ${LANDING_NAV_SCROLL_MARGIN_CLASS} ${className}`}
    >
      {resolvedDividerBefore ? (
        <Box className="relative z-20">
          <LandingSectionDivider />
        </Box>
      ) : null}
      {resolvedRipple ? (
        <Box className="pointer-events-none absolute inset-0 z-0 opacity-[0.38]">
          <RippleBackground overlay />
        </Box>
      ) : null}
      <Box className={`relative z-10 ${fullBleed ? "" : contentClassName}`}>{children}</Box>
    </Tag>
  );
}
