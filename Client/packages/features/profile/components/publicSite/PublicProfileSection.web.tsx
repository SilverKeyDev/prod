import type { ReactNode } from "react";

import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal.web";
import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

export type PublicProfileSectionTone = "base" | "surface";

/** Content container matching the landing nav width so sections align with the header. */
export const PUBLIC_PROFILE_CONTAINER_CLASS =
  "px-responsive-sm mx-auto w-full max-w-[1100px]";

/** Small uppercase label above section headings, mirroring the landing eyebrow. */
export function PublicProfileEyebrow({ children }: { children: string }) {
  return (
    <BodyText
      as="span"
      size="xs"
      className="text-brand-primary font-semibold uppercase tracking-widest"
    >
      {children}
    </BodyText>
  );
}

type PublicProfileSectionProps = {
  id: string;
  /** Optional uppercase label above the heading; omit for a heading-only section. */
  eyebrow?: string;
  heading: string;
  tone?: PublicProfileSectionTone;
  /** Smaller heading and tighter vertical rhythm for utility bands (e.g. `#search`). */
  compact?: boolean;
  /** Center the heading and content horizontally. */
  centered?: boolean;
  children: ReactNode;
};

const TONE_CLASS: Record<PublicProfileSectionTone, string> = {
  base: "bg-background-base",
  surface: "bg-background-surface",
};

/**
 * Landing-style section band for the public agent site: anchor id (offset for
 * the fixed nav), eyebrow label, and serif heading above the section content.
 */
export function PublicProfileSection({
  id,
  eyebrow,
  heading,
  tone = "base",
  compact = false,
  centered = false,
  children,
}: PublicProfileSectionProps) {
  const { ref, inView } = useLandingReveal({ threshold: 0.1 });
  const rhythmClass = compact
    ? "gap-4 py-10 sm:py-12"
    : "gap-5 py-14 sm:gap-6 sm:py-16";
  const alignClass = centered ? "items-center text-center" : "";

  return (
    <section
      id={id}
      className={`border-border border-t ${TONE_CLASS[tone]} ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Box
        ref={ref}
        className={`${PUBLIC_PROFILE_CONTAINER_CLASS} ${rhythmClass} ${alignClass} motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
          inView
            ? "translate-y-0 opacity-100"
            : "motion-safe:translate-y-8 motion-safe:opacity-0"
        }`}
      >
        <Box className="gap-1.5">
          {eyebrow ? (
            <PublicProfileEyebrow>{eyebrow}</PublicProfileEyebrow>
          ) : null}
          <Title as="h2" size={compact ? "md" : "lg"} className="!font-serif">
            {heading}
          </Title>
        </Box>
        {children}
      </Box>
    </section>
  );
}
