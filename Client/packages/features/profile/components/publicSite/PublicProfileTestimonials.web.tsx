import { useLocalization } from "packages/contexts";
import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal.web";
import type {
  AgentPublicProfileViewModel,
  PublicAgentTestimonial,
} from "packages/features/profile/utils/public/agentPublicProfileViewModel";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import { Icon } from "packages/ui/components/media/icons";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { PUBLIC_PROFILE_SECTION_ANCHOR_CLASS } from "./PublicProfileSection.web";

function RatingStars({ rating }: { rating: number }) {
  return (
    <Box className="flex flex-row items-center gap-0.5" aria-hidden>
      {Array.from({ length: rating }, (_, i) => (
        <Icon key={i} name="star" size={14} fill="currentColor" className="text-gold" />
      ))}
    </Box>
  );
}

function TestimonialCard({ item }: { item: PublicAgentTestimonial }) {
  return (
    <Box className="w-80 shrink-0 px-2 sm:w-96 sm:px-2.5">
      <Box className="border-border bg-background-surface h-full gap-4 rounded-2xl border p-5 shadow-sm sm:p-6">
        {item.rating != null ? <RatingStars rating={item.rating} /> : null}
        <BodyText size="md" className="text-text-primary leading-relaxed">
          “{item.quote}”
        </BodyText>
        <Box className="gap-0.5">
          <BodyText size="sm" className="text-text-primary font-semibold">
            {item.authorName}
          </BodyText>
          {item.date ? (
            <BodyText size="xs" muted>
              {item.date}
            </BodyText>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function TestimonialBand({
  items,
  ariaHidden = false,
}: {
  items: PublicAgentTestimonial[];
  ariaHidden?: boolean;
}) {
  return (
    <Box className="flex shrink-0 items-stretch" aria-hidden={ariaHidden || undefined}>
      {items.map((item, index) => (
        <TestimonialCard
          key={`${item.authorName}-${index}${ariaHidden ? "-duplicate" : ""}`}
          item={item}
        />
      ))}
    </Box>
  );
}

type PublicProfileTestimonialsProps = {
  model: AgentPublicProfileViewModel;
};

/**
 * Client testimonials as a landing-style auto-scrolling marquee
 * (`#testimonials`): centered serif heading, duplicated card band with edge
 * fades, paused on hover, static under reduced motion. Hidden when empty.
 */
export function PublicProfileTestimonials({ model }: PublicProfileTestimonialsProps) {
  const { t } = useLocalization();
  const { ref, inView } = useLandingReveal({ threshold: 0.1 });
  if (!model.hasTestimonials) return null;

  return (
    <section
      id={PUBLIC_PROFILE_SECTION_IDS.testimonials}
      className={`bg-background-base border-border overflow-hidden border-t ${PUBLIC_PROFILE_SECTION_ANCHOR_CLASS}`}
    >
      <Box
        ref={ref}
        className={`pb-14 pt-12 motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-y-0 motion-reduce:opacity-100 sm:pb-16 sm:pt-14 ${
          inView ? "translate-y-0 opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0"
        }`}
      >
        <Title
          as="h2"
          size="lg"
          className="!text-text-primary px-responsive-sm mb-9 text-center !font-serif text-2xl font-bold leading-tight sm:mb-11 sm:text-3xl"
        >
          {t("profile.public.testimonials_heading")}
        </Title>

        <Box className="relative overflow-hidden">
          <Box
            className="from-background-base pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r to-transparent sm:w-20"
            aria-hidden
          />
          <Box
            className="from-background-base pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l to-transparent sm:w-20"
            aria-hidden
          />
          <Box className="landing-partner-marquee motion-safe:animate-landing-partner-marquee flex w-max py-1 hover:motion-safe:[animation-play-state:paused] motion-reduce:animate-none">
            <TestimonialBand items={model.testimonials} />
            <TestimonialBand items={model.testimonials} ariaHidden />
          </Box>
        </Box>
      </Box>
    </section>
  );
}
