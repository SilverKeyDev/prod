import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  shadow = 'sm',
  onClick,
  style,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-3 sm:p-4 md:p-6',
    lg: 'p-4 sm:p-6 md:p-8',
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const baseClasses = [
    'bg-white',
    'rounded-lg sm:rounded-xl md:rounded-2xl',
    'border border-beige/30',
    shadowClasses[shadow],
    paddingClasses[padding],
    'transition-all duration-200',
  ];

  if (hover) {
    baseClasses.push('hover:shadow-md');
  }

  if (onClick) {
    baseClasses.push('cursor-pointer');
  }

  const combinedClasses = [...baseClasses, className].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} onClick={onClick} style={style}>
      {children}
    </div>
  );
};

export default Card;
