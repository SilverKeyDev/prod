import React from "react";

import { Image } from "@ui/media";

type KeyLogoProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  showText?: boolean;
  className?: string;
  textClassName?: string;
  logoClassName?: string;
};

const KeyLogo: React.FC<KeyLogoProps> = ({
  size = "md",
  className = "",
  logoClassName = "",
}) => {
  const sizeClasses = {
    xs: {
      logo: "h-8 w-auto",
      container: "gap-2",
    },
    sm: {
      logo: "h-12 w-auto",
      container: "gap-2",
    },
    md: {
      logo: "h-16 w-auto",
      container: "gap-3",
    },
    lg: {
      logo: "h-20 w-auto",
      container: "gap-3",
    },
    xl: {
      logo: "h-24 w-auto",
      container: "gap-4",
    },
    "2xl": {
      logo: "h-32 w-auto",
      container: "gap-5",
    },
    "3xl": {
      logo: "h-40 w-auto",
      container: "gap-6",
    },
    "4xl": {
      logo: "h-48 w-auto",
      container: "gap-8",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${currentSize.container} ${className}`}>
      <Image
        src="/logo.png"
        alt="SilverKey Logo"
        className={`${currentSize.logo} object-contain ${logoClassName}`}
      />
    </div>
  );
};

export default KeyLogo;
