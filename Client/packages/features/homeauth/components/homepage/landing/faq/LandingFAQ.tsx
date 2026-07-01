import { useState } from "react";

import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Button, Title } from "@/components/ui";

import { LandingEyebrow } from "../shared/LandingEyebrow";

export function LandingFAQ() {
  const { faq } = LANDING_CONTENT;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, inView } = useLandingReveal({ threshold: 0.1 });

  return (
    <section
      id={LANDING_SECTION_IDS.faq}
      className="bg-background-base px-responsive-sm py-16 sm:py-20"
    >
      <Box
        className={`mx-auto max-w-[680px] text-center motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
          inView ? "translate-y-0 opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0"
        }`}
      >
        <LandingEyebrow>{faq.eyebrow}</LandingEyebrow>
        <Title as="h2" size="lg" className="!font-serif">
          {faq.headline}
        </Title>
      </Box>

      <Box ref={ref} className="mx-auto mt-9 max-w-[680px]">
        {faq.items.map((item, index) => {
          const isOpen = openIndex === index;
          const delay = Math.min(index, 4) * 0.08;

          return (
            <Box
              key={item.question}
              className={`border-border border-b motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
                inView
                  ? "translate-y-0 opacity-100"
                  : "motion-safe:translate-y-8 motion-safe:opacity-0"
              }`}
              style={inView ? { transitionDelay: `${delay}s` } : undefined}
            >
              <Button
                variant="ghost"
                size="md"
                label={item.question}
                onPress={() => setOpenIndex(isOpen ? null : index)}
                className="!h-auto w-full !justify-between gap-4 px-0 py-4 text-left font-medium"
              >
                <BodyText as="span" size="sm" className="flex-1 text-left">
                  {item.question}
                </BodyText>
                <BodyText
                  as="span"
                  size="lg"
                  className={`!text-brand-primary shrink-0 motion-safe:transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </BodyText>
              </Button>
              {isOpen ? (
                <BodyText as="p" size="sm" muted className="pb-4 leading-relaxed">
                  {item.answer}
                </BodyText>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </section>
  );
}
