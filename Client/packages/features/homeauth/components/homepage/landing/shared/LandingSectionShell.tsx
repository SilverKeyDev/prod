import type { ReactNode } from "react";

import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import type {
  LandingSectionLayout,
  LandingSectionTone,
} from "packages/features/homeauth/utils/landingSectionLayout";
import { Box } from "packages/ui/components/structure/primitives";
import RippleBackground from "packages/ui/components/surfaces/backgrounds/RippleBackground";
import { isWeb } from "packages/utils/core/platform";

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
  as: asTag = "section",
  layout,
  tone,
  ripple,
  dividerBefore,
  children,
  className = "",
  contentClassName = "",
  fullBleed = false,
}: LandingSectionShellProps) {
  // `section`/`footer` are web landmark elements. React Native has no view config for them
  // ("View config getter callback for component `section` must be a function"), so on native
  // render a plain Box and keep the semantic tag for web only.
  const Tag = isWeb ? asTag : Box;

  const resolvedTone = tone ?? layout?.tone ?? "base";
  const resolvedRipple = ripple ?? layout?.ripple ?? false;
  const resolvedDividerBefore = dividerBefore ?? layout?.dividerBefore ?? false;

  return (
    <Tag
      id={id}
      className={`relative overflow-hidden ${TONE_CLASS[resolvedTone]} ${LANDING_NAV_SCROLL_MARGIN_CLASS} ${className}`}
    >
      {resolvedDividerBefore ? (
        <Box className="z-header relative">
          <LandingSectionDivider />
        </Box>
      ) : null}
      {resolvedRipple ? (
        <Box className="pointer-events-none absolute inset-0 z-0 opacity-[0.38]">
          <RippleBackground overlay />
        </Box>
      ) : null}
      <Box className={`z-header relative ${fullBleed ? "" : contentClassName}`}>{children}</Box>
    </Tag>
  );
}
