import React from 'react';

interface MiniLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  logoClassName?: string;
}

const MiniLogo: React.FC<MiniLogoProps> = ({ 
  size = 'sm', 
  className = '',
  logoClassName = ''
}) => {
  const sizeClasses = {
    xs: {
      logo: 'h-4 w-auto'
    },
    sm: {
      logo: 'h-6 w-auto'
    },
    md: {
      logo: 'h-8 w-auto'
    },
    lg: {
      logo: 'h-10 w-auto'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/images/minilogo.png" 
        alt="SilverKey Mini Logo" 
        className={`${currentSize.logo} object-contain ${logoClassName}`}
      />
    </div>
  );
};

export default MiniLogo;
