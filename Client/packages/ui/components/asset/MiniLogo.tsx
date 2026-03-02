import React from "react";

import AppImage from "packages/ui/components/asset/AppImage";
import { MINI_LOGO_URI } from "packages/ui/components/asset/logoSource";

type MiniLogoProps = {
  size?: "xs" | "sm" | "md" | "lg" | "header";
  className?: string;
  logoClassName?: string;
};

const MiniLogo: React.FC<MiniLogoProps> = ({ size = "sm", className = "", logoClassName = "" }) => {
  const sizeClasses = {
    xs: {
      logo: "h-4 w-auto",
    },
    sm: {
      logo: "h-6 w-auto",
    },
    md: {
      logo: "h-8 w-auto",
    },
    lg: {
      logo: "h-10 w-auto",
    },
    header: {
      logo: "h-13 w-auto",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <AppImage
        uri={MINI_LOGO_URI}
        alt="SilverKey Mini Logo"
        className={`${currentSize.logo} object-contain ${logoClassName}`}
      />
    </div>
  );
};

// Export both named and default for compatibility
export { MiniLogo };
export default MiniLogo;
