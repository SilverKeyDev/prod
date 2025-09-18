import React from 'react';

export type CardPriceBubbleProps = {
  /** Price to display */
  price: string | number;
  /** Position of the bubble */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
};

const POSITION_MAP: Record<NonNullable<CardPriceBubbleProps['position']>, string> = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
};

const BUBBLE_SIZE: Record<NonNullable<CardPriceBubbleProps['size']>, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-2.5 py-1 text-xs sm:text-sm',
  md: 'px-3 py-1.5 text-sm sm:text-base',
  lg: 'px-4 py-2 text-base sm:text-lg',
};

const CardPriceBubble: React.FC<CardPriceBubbleProps> = ({
  price,
  position = 'top-right',
  size = 'sm',
  className = '',
}) => {
  const formatPrice = (price: string | number): string => {
    if (typeof price === 'number') {
      return `$${price.toLocaleString()}`;
    }
    return price.toString();
  };

  const bubbleClass = BUBBLE_SIZE[size];

  return (
    <div className={`absolute ${POSITION_MAP[position]} z-10`}>
      <div
        className={`flex items-center justify-center rounded-full border border-neutral-200/50 bg-neutral-50/95 font-semibold text-brand-primary backdrop-blur-sm ${bubbleClass} ${className} `}
      >
        {formatPrice(price)}
      </div>
    </div>
  );
};

export default CardPriceBubble;
