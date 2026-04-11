import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";

import { StatCard } from "./StatCard";

export function LandingSocialProof() {
  const { socialProof } = LANDING_CONTENT;

  return (
    <section
      id="about"
      className={`px-responsive-sm bg-[color:var(--color-brand-primary)] py-16 sm:py-20 ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Box className="mx-auto max-w-6xl">
        <Title
          as="h2"
          size="lg"
          id="social-proof-heading"
          className="mb-12 text-center !font-sans font-light !text-white"
        >
          {socialProof.headline}
        </Title>
        <Box className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {socialProof.stats.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} size="lg" />
          ))}
        </Box>
        <Box className="flex flex-col items-center gap-4">
          {socialProof.quotes.map((q) => (
            <Box
              key={q.text}
              className="border-border-card-subtle w-full max-w-2xl rounded-lg border bg-white/5 p-6 text-center backdrop-blur-sm"
            >
              <BodyText as="p" size="sm" className="!text-white/90">
                {q.text}
              </BodyText>
              <BodyText as="p" size="xs" className="mt-3 !text-white/75">
                {q.attribution}
              </BodyText>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
