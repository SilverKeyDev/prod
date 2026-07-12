import type { ReactNode } from "react";

import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal.web";
import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

export type PublicProfileSectionTone = "base" | "surface";

/** Content container matching the landing nav width so sections align with the header. */
export const PUBLIC_PROFILE_CONTAINER_CLASS = "px-responsive-sm mx-auto w-full max-w-[1100px]";

/** Anchor offset for the fixed nav; re-exported so sibling sections avoid re-importing landing chrome. */
export const PUBLIC_PROFILE_SECTION_ANCHOR_CLASS = LANDING_NAV_SCROLL_MARGIN_CLASS;

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
  children,
}: PublicProfileSectionProps) {
  const { ref, inView } = useLandingReveal({ threshold: 0.1 });

  return (
    <section
      id={id}
      className={`border-border border-t ${TONE_CLASS[tone]} ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Box
        ref={ref}
        className={`${PUBLIC_PROFILE_CONTAINER_CLASS} gap-5 py-14 motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-y-0 motion-reduce:opacity-100 sm:gap-6 sm:py-16 ${
          inView ? "translate-y-0 opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0"
        }`}
      >
        <Box className="gap-1.5">
          {eyebrow ? <PublicProfileEyebrow>{eyebrow}</PublicProfileEyebrow> : null}
          <Title as="h2" size="lg" className="!font-serif">
            {heading}
          </Title>
        </Box>
        {children}
      </Box>
    </section>
  );
}
