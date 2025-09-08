import React from "react";
import RippleBackground from "../../features/homeauth/RippleBackground";

const MaintenanceScreen: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col hide-scrollbar">
    <RippleBackground />
    <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 relative">
      <div className="absolute inset-0 z-0">
        <RippleBackground />
      </div>
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl text-center">
        <div className="bg-white p-6 sm:p-8 md:p-10 lg:p-12 rounded-lg sm:rounded-xl shadow-lg">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif text-olive font-black leading-tight">
              We'll be back soon!
            </h1>
          </div>
          <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-600">
            SilverKey is undergoing scheduled maintenance, please check back in
            a few minutes.
          </p>
        </div>
      </div>
    </main>
  </div>
);

export default MaintenanceScreen;
