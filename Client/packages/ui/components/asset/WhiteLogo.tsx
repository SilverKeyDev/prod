import React from "react";

import { Box } from "packages/ui/components/primitives";

import MiniLogo from "./MiniLogo";

type WhiteLogoProps = {
  size?: "xs" | "sm" | "md" | "lg" | "header";
  className?: string;
};

const WhiteLogo: React.FC<WhiteLogoProps> = ({ size, className }) => {
  return (
    <Box className={className} style={{ filter: "brightness(0) invert(1)" }}>
      <MiniLogo size={size} />
    </Box>
  );
};

export default WhiteLogo;
