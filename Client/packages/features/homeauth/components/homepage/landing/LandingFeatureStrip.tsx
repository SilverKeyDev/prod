import { Icon } from "@ui/icons";

import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";

export function LandingFeatureStrip() {
  const { sectionHeading, items } = LANDING_CONTENT.featureStrip;

  return (
    <section
      id="buyers"
      className={`border-border border-y bg-neutral-100/80 ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Title as="h2" size="sm" className="sr-only">
        {sectionHeading}
      </Title>
      <Box className="px-responsive-sm mx-auto max-w-6xl py-12 md:py-14">
        <Box className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 sm:gap-y-5">
          {items.map((item, index) => (
            <Box
              key={item.label}
              className={`flex min-w-0 items-center justify-center gap-2.5 text-center sm:justify-start sm:px-6 sm:text-left ${
                index > 0 ? "sm:border-border sm:border-l sm:pl-6" : ""
              }`}
            >
              <Icon
                name={item.icon}
                className="text-text-secondary h-5 w-5 shrink-0"
                aria-hidden
              />
              <BodyText
                as="span"
                size="sm"
                className="text-text-primary min-w-0 break-words font-medium"
              >
                {item.label}
              </BodyText>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
