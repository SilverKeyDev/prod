import type { ReactElement } from "react";

import type { LandingPartnerLogoKey } from "packages/features/homeauth/types/landingContent";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

function GTVenturesLogo() {
  return (
    <Box className="flex items-center gap-2.5">
      <Box className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1A1A2E]">
        <BodyText as="span" size="lg" className="!font-serif font-bold !text-[#C4A552]">
          GT
        </BodyText>
      </Box>
      <Box>
        <BodyText as="p" size="sm" className="!font-serif font-bold !text-[#1A1A2E]">
          Ventures
        </BodyText>
        <BodyText as="p" size="xs" className="!text-[#9E9B92]">
          Early Stage Investor
        </BodyText>
      </Box>
    </Box>
  );
}

function SkySlopeLogo() {
  return (
    <Box className="flex items-center gap-2.5">
      <Box className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0066CC]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <polyline
            points="3,18 10,8 17,13"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="17" cy="13" r="2.2" fill="#fff" />
        </svg>
      </Box>
      <BodyText as="span" size="md" className="font-bold tracking-tight !text-[#0066CC]">
        Sky
        <BodyText as="span" size="md" className="!text-text-primary font-normal">
          Slope
        </BodyText>
      </BodyText>
    </Box>
  );
}

function BetterLogo() {
  return (
    <Box className="flex items-center gap-2.5">
      <Box className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00BA66]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12L10 17L19 8"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
      <Box>
        <BodyText as="p" size="md" className="font-extrabold tracking-tight">
          Better
        </BodyText>
        <BodyText as="p" size="xs" className="muted">
          Mortgage Partner
        </BodyText>
      </Box>
    </Box>
  );
}

function MoveConciergeLogo() {
  return (
    <Box className="flex items-center gap-2.5">
      <Box className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-[#2DA771] bg-[#E8F7F0]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 10L12 3L21 10V20H15V14H9V20H3V10Z"
            stroke="#2DA771"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
      <Box>
        <BodyText as="p" size="sm" className="font-bold">
          Move
        </BodyText>
        <BodyText as="p" size="sm" className="font-bold !text-[#2DA771]">
          Concierge
        </BodyText>
      </Box>
    </Box>
  );
}

function ExpRealtyLogo() {
  return (
    <Box className="flex flex-col items-center gap-1">
      <BodyText as="p" size="xl" className="leading-none tracking-tight">
        <BodyText as="span" size="xl" className="font-light">
          e
        </BodyText>
        <BodyText as="span" size="xl" className="font-black">
          X
        </BodyText>
        <BodyText as="span" size="xl" className="font-light">
          p
        </BodyText>
      </BodyText>
      <BodyText
        as="p"
        size="xs"
        className="w-full border-t border-[#C0BDB8] pt-1 text-center font-bold uppercase tracking-[0.18em] !text-[#5C5A52]"
      >
        REALTY
      </BodyText>
    </Box>
  );
}

function GABrokerLogo() {
  return (
    <Box className="flex flex-col items-center gap-1.5">
      <Box className="border-brand-primary flex h-12 w-12 items-center justify-center rounded-full border-2">
        <BodyText as="span" size="sm" className="!text-brand-primary !font-serif font-bold">
          GA
        </BodyText>
      </Box>
      <BodyText
        as="p"
        size="xs"
        className="text-brand-primary font-semibold uppercase tracking-wide"
      >
        Licensed Broker
      </BodyText>
    </Box>
  );
}

const LOGO_BY_KEY: Record<LandingPartnerLogoKey, () => ReactElement> = {
  "gt-ventures": GTVenturesLogo,
  skyslope: SkySlopeLogo,
  better: BetterLogo,
  "move-concierge": MoveConciergeLogo,
  "exp-realty": ExpRealtyLogo,
  "ga-broker": GABrokerLogo,
};

type PartnerLogoMarkProps = {
  logoKey: LandingPartnerLogoKey;
};

export function PartnerLogoMark({ logoKey }: PartnerLogoMarkProps) {
  const Logo = LOGO_BY_KEY[logoKey];
  return (
    <Box className="flex h-[60px] w-full items-center justify-center">
      <Logo />
    </Box>
  );
}
