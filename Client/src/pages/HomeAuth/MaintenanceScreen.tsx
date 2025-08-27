import React from "react";
import { Link } from "react-router-dom";
import KeyLogo from "../../components/ui/KeyLogo";
import RippleBackground from "../../components/ui/RippleBackground";
import RippleBackgroundMobile from "../../components/ui/RippleBackgroundMobile";

const MaintenanceScreen: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col hide-scrollbar">
    <div className="block sm:hidden">
      <RippleBackgroundMobile />
    </div>
    <div className="hidden sm:block">
      <RippleBackground />
    </div>
    {/* Header */}
    <header className="w-full flex justify-between items-center space-responsive-sm border-b border-gray-200 bg-white relative z-10 shadow-lg">
      <KeyLogo size="xs" />
    </header>
    <main className="flex-1 flex flex-col items-center justify-center px-responsive-sm py-responsive-lg relative">
      <div className="absolute inset-0 z-0 block sm:hidden">
        <RippleBackgroundMobile />
      </div>
      <div className="absolute inset-0 z-0 hidden sm:block">
        <RippleBackground />
      </div>
      <div className="relative z-10 max-w-3xl text-center w-full">
        <div className="bg-white space-responsive-md rounded-lg shadow-lg">
          <h2 className="text-responsive-xl font-serif text-black font-bold space-y-responsive-sm">
            We'll be back soon!
          </h2>
          <p className="text-gray-600 space-y-responsive-md text-responsive-md">
            Our site is currently undergoing scheduled maintenance.<br />
            Please check back in a few minutes.<br /><br />
            Thank you for your patience!
          </p>
        </div>
      </div>
      <div className="relative mt-10 flex flex-wrap justify-center items-center gap-responsive-sm text-responsive-sm text-center">
        <Link
          to="/privacy"
          className="bg-white text-black px-responsive-sm py-responsive-xs rounded-lg shadow hover:shadow-md transition-colors duration-200 touch-friendly"
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          className="bg-white text-black px-responsive-sm py-responsive-xs rounded-lg shadow hover:shadow-md transition-colors duration-200 touch-friendly"
        >
          Terms of Service
        </Link>
        <Link
          to="/contact"
          className="bg-white text-black px-responsive-sm py-responsive-xs rounded-lg shadow hover:shadow-md transition-colors duration-200 touch-friendly"
        >
          Contact Us
        </Link>
      </div>
    </main>
  </div>
);

export default MaintenanceScreen;
