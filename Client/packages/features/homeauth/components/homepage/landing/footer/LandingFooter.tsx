import type { LucideIcon } from "lucide-react";
import { Instagram, Linkedin } from "lucide-react";

import { LandingSectionShell } from "packages/features/homeauth/components/homepage/landing/shared/LandingSectionShell";
import type { LandingSocialIcon } from "packages/features/homeauth/types/landingContent";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_FOOTER_LAYOUT } from "packages/features/homeauth/utils/landingSectionLayout";
import { Link } from "packages/navigation";
import { MINI_LOGO } from "packages/ui/components/media/asset";
import { Box, Image } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

import { BodyText, Button, Title } from "@/components/ui";

function XIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_ICON: Record<LandingSocialIcon, LucideIcon | typeof XIcon> = {
  linkedin: Linkedin,
  x: XIcon,
  instagram: Instagram,
};

export function LandingFooter() {
  const { footer } = LANDING_CONTENT;

  return (
    <LandingSectionShell
      as="footer"
      layout={LANDING_FOOTER_LAYOUT}
      className="safe-bottom px-responsive-sm py-10 sm:px-10"
      fullBleed
    >
      <Box className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-7">
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
          {footer.socialLinks.map((social) => {
            const IconComponent = SOCIAL_ICON[social.icon];
            return (
              <Button
                key={social.label}
                variant="ghost"
                size="sm"
                label={social.label}
                onPress={() => getWindow()?.open(social.href, "_blank", "noopener,noreferrer")}
                className="border-border text-text-secondary hover:text-text-primary h-8 min-h-8 w-8 min-w-8 rounded-md border px-0"
              >
                <IconComponent size={16} aria-hidden />
              </Button>
            );
          })}
        </Box>
      </Box>

      <Box className="border-border mx-auto mt-5 max-w-4xl border-t pt-4">
        <BodyText as="p" size="xs" muted>
          {footer.copyright} {footer.disclaimer}
        </BodyText>
      </Box>
    </LandingSectionShell>
  );
}
