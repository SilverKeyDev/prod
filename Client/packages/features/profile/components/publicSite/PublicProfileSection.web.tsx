import type { ReactNode } from "react";

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
    <Box className="flex flex-row items-center gap-2">
      <Box className="bg-brand-primary h-px w-4" aria-hidden />
      <BodyText
        as="span"
        size="xs"
        className="text-brand-primary font-semibold uppercase tracking-widest"
      >
        {children}
      </BodyText>
    </Box>
  );
}

type PublicProfileSectionProps = {
  id: string;
  eyebrow: string;
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
  return (
    <section
      id={id}
      className={`border-border border-t ${TONE_CLASS[tone]} ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Box
        className={`${PUBLIC_PROFILE_CONTAINER_CLASS} gap-8 py-16 sm:gap-10 sm:py-20`}
      >
        <Box className="gap-3">
          <PublicProfileEyebrow>{eyebrow}</PublicProfileEyebrow>
          <Title as="h2" size="lg" className="!font-serif">
            {heading}
          </Title>
        </Box>
        {children}
      </Box>
    </section>
  );
}
