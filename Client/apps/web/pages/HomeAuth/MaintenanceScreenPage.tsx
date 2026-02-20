import React from "react";

import { BodyText, Title } from "@/components/ui/index.web";
import RippleBackground from "@/features/homeauth/RippleBackground.web";

const MaintenanceScreen: React.FC = () => (
  <div className="hide-scrollbar flex min-h-screen flex-col bg-white">
    <RippleBackground />
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16">
      <div className="absolute inset-0 z-0">
        <RippleBackground />
      </div>
      <div className="relative z-10 w-full max-w-xs text-center sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <div className="rounded-lg bg-white p-6 shadow-lg sm:rounded-xl sm:p-8 md:p-10 lg:p-12">
          <div className="mb-4 flex items-center justify-center gap-2 sm:mb-6 sm:gap-3">
            <Title size="xl" as="h1" className="text-olive">
              We'll be back soon!
            </Title>
          </div>
          <BodyText size="sm" muted>
            SilverKey is undergoing scheduled maintenance, please check back in
            a few minutes.
          </BodyText>
        </div>
      </div>
    </main>
  </div>
);

export default MaintenanceScreen;
