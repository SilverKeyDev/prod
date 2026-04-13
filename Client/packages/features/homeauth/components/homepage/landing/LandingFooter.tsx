import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import {
  HomeHashLink,
  homeLandingSectionIdFromHref,
  Link,
} from "packages/navigation";
import { LOGO } from "packages/ui/components/asset";
import { Box, Image } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

export function LandingFooter() {
  const { footer } = LANDING_CONTENT;

  return (
    <footer className="safe-bottom border-border px-responsive-sm border-t py-10 sm:py-12">
      <Box className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between md:gap-12">
        <Box className="max-w-sm shrink-0">
          <Link to="/" className="mb-3 inline-block">
            <Image src={LOGO} alt="SilverKey" className="h-7 w-auto" />
          </Link>
          <BodyText as="p" size="xs" muted className="break-words">
            {footer.description}
          </BodyText>
        </Box>
        <Box className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-12">
          {footer.columns.map((col) => (
            <Box key={col.heading} className="flex flex-col gap-3">
              <BodyText
                as="p"
                size="xs"
                className="text-text-primary font-semibold uppercase tracking-wide"
              >
                {col.heading}
              </BodyText>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => {
                  const sectionId = homeLandingSectionIdFromHref(l.href);
                  const linkClass =
                    "text-text-secondary hover:text-text-primary inline-flex min-h-11 max-w-full items-center break-words py-1 text-xs motion-safe:transition-colors touch-manipulation";
                  return (
                    <li key={l.href}>
                      {sectionId ? (
                        <HomeHashLink
                          sectionId={sectionId}
                          className={linkClass}
                        >
                          {l.label}
                        </HomeHashLink>
                      ) : (
                        <Link to={l.href} className={linkClass}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Box>
          ))}
        </Box>
      </Box>
    </footer>
  );
}
