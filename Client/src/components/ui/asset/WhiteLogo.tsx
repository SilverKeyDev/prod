import React from 'react';

import MiniLogo from './MiniLogo';

type WhiteLogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'header';
  className?: string;
};

const WhiteLogo: React.FC<WhiteLogoProps> = ({ size, className }) => {
  return (
    <MiniLogo
      size={size}
      className={className}
      logoClassName="text-white fill-white stroke-white"
    />
  );
};

export default WhiteLogo;
