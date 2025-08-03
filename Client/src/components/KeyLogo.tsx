import React from 'react';

interface KeyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
  logoClassName?: string;
}

const KeyLogo: React.FC<KeyLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  textClassName = '',
  logoClassName = ''
}) => {
  const sizeClasses = {
    sm: {
      logo: 'h-12 w-auto',
      container: 'gap-2'
    },
    md: {
      logo: 'h-16 w-auto',
      container: 'gap-3'
    },
    lg: {
      logo: 'h-20 w-auto',
      container: 'gap-3'
    },
    xl: {
      logo: 'h-24 w-auto',
      container: 'gap-4'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${currentSize.container} ${className}`}>
      <img 
        src="/logo.png" 
        alt="SilverKey Logo" 
        className={`${currentSize.logo} object-contain ${logoClassName}`}
      />
    </div>
  );
};

export default KeyLogo;
