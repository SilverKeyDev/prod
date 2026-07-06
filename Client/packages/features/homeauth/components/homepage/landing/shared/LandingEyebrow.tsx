import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

type LandingEyebrowProps = {
  children: string;
  className?: string;
};

export function LandingEyebrow({ children, className = "" }: LandingEyebrowProps) {
  return (
    <Box className={`mb-3.5 flex items-center justify-center gap-2 ${className}`}>
      <Box className="bg-brand-primary h-px w-4" aria-hidden />
      <BodyText
        as="span"
        size="xs"
        className="text-brand-primary font-semibold uppercase tracking-widest"
      >
        {children}
      </BodyText>
    </Box>
  );
}
