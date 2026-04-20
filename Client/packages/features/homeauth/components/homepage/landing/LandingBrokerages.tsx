import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";

export function LandingBrokerages() {
  const { headline, subheadline, pillars } = LANDING_CONTENT.brokerages;

  return (
    <section
      id="brokerages"
      className={`border-border bg-background-surface border-y ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Box className="px-responsive-sm mx-auto max-w-6xl py-14 md:py-16">
        <Box className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <Title
            as="h2"
            size="lg"
            id="brokerages-heading"
            className="text-text-primary mb-4 font-light md:text-3xl"
          >
            {headline}
          </Title>
          <BodyText as="p" size="md" muted className="mx-auto max-w-2xl">
            {subheadline}
          </BodyText>
        </Box>
        <Box className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {pillars.map((pillar) => (
            <Box
              key={pillar.title}
              className="flex min-w-0 flex-col gap-2 text-center md:text-left"
            >
              <Title as="h3" size="sm" className="text-text-primary font-medium">
                {pillar.title}
              </Title>
              <BodyText as="p" size="sm" muted>
                {pillar.body}
              </BodyText>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
