import type { LandingPartnerLogoKey } from "packages/features/homeauth/types/landingContent";
import { getLandingPartnerLogoUri } from "packages/features/homeauth/utils/landingPartnerLogos";
import { Box, Image } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

type PartnerLogoMarkProps = {
  logoKey?: LandingPartnerLogoKey;
  title: string;
  alt: string;
  /** Compact sizing for the infinite logo band. */
  band?: boolean;
};

export function PartnerLogoMark({ logoKey, title, alt, band = false }: PartnerLogoMarkProps) {
  return (
    <Box className={`flex w-full items-center justify-center px-2 ${band ? "h-12" : "h-14"}`}>
      {logoKey ? (
        <Image
          src={getLandingPartnerLogoUri(logoKey)}
          alt={alt}
          className={
            band
              ? "max-h-9 w-auto max-w-32 object-contain opacity-90"
              : "max-h-10 w-auto max-w-36 object-contain"
          }
          loading="lazy"
        />
      ) : (
        <BodyText
          as="p"
          size="xs"
          muted={band}
          className={`line-clamp-2 max-w-full text-center leading-snug ${band ? "font-medium" : "font-semibold"}`}
        >
          {title}
        </BodyText>
      )}
    </Box>
  );
}
