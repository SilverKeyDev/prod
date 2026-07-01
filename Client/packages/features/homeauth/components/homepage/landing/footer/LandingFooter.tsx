import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { Link } from "packages/navigation";
import { MINI_LOGO } from "packages/ui/components/media/asset";
import { Box, Image } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

import { BodyText, Button, Title } from "@/components/ui";

export function LandingFooter() {
  const { footer } = LANDING_CONTENT;

  return (
    <footer className="safe-bottom border-border px-responsive-sm border-t bg-neutral-100/80 py-10 sm:px-10">
      <Box className="mx-auto flex max-w-[900px] flex-wrap items-start justify-between gap-7">
        <Box>
          <Box className="mb-1 flex items-center gap-2">
            <Image src={MINI_LOGO} alt="SilverKey" className="h-7 w-7 object-contain" />
            <Title as="span" size="sm" className="!text-brand-primary !font-serif font-bold">
              SilverKey
            </Title>
          </Box>
          <BodyText as="p" size="xs" muted>
            {footer.location}
          </BodyText>
        </Box>

        <Box className="flex gap-5">
          {footer.legalLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <BodyText
                as="span"
                size="sm"
                muted
                className="hover:text-text-primary motion-safe:transition-colors"
              >
                {link.label}
              </BodyText>
            </Link>
          ))}
        </Box>

        <Box className="flex gap-2">
          {footer.socialLinks.map((social) => (
            <Button
              key={social.label}
              variant="ghost"
              size="sm"
              label={social.label}
              onPress={() => getWindow()?.open(social.href, "_blank", "noopener,noreferrer")}
              className="border-border text-text-secondary hover:text-text-primary h-8 min-h-8 w-8 min-w-8 rounded-md border px-0 text-xs"
            >
              {social.text}
            </Button>
          ))}
        </Box>
      </Box>

      <Box className="border-border mx-auto mt-5 max-w-[900px] border-t pt-4">
        <BodyText as="p" size="xs" muted>
          {footer.copyright} {footer.disclaimer}
        </BodyText>
      </Box>
    </footer>
  );
}
