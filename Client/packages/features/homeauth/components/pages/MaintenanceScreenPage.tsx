import React from "react";

import { RippleBackground } from "packages/ui/components/backgrounds";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";

const MaintenanceScreen: React.FC = () => (
  <Box className="hide-scrollbar bg-background-surface flex min-h-screen flex-col">
    <RippleBackground />
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16">
      <Box className="absolute inset-0 z-0">
        <RippleBackground />
      </Box>
      <Box className="relative z-10 w-full max-w-xs text-center sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <Box className="bg-background-surface rounded-lg p-6 shadow-lg sm:rounded-xl sm:p-8 md:p-10 lg:p-12">
          <Box className="mb-4 flex items-center justify-center gap-2 sm:mb-6 sm:gap-3">
            <Title size="xl" as="h1" className="text-primary">
              We'll be back soon!
            </Title>
          </Box>
          <BodyText size="sm" muted>
            SilverKey is undergoing scheduled maintenance, please check back in a few minutes.
          </BodyText>
        </Box>
      </Box>
    </main>
  </Box>
);

export default MaintenanceScreen;
