import React from 'react';
import { Bed, Bath, Square, Home, Calendar, DollarSign } from 'lucide-react';

export interface PropertyDetailsProps {
  /** Number of bedrooms */
  bedrooms?: number;
  /** Number of bathrooms */
  bathrooms?: number;
  /** Square footage */
  sqft?: number;
  /** Property type */
  propertyType?: string;
  /** Year built */
  yearBuilt?: number;
  /** Lot size */
  lotSize?: string | number;
  /** HOA fees */
  hoaFees?: string | number;
  /** Property tax */
  propertyTax?: string | number;
  /** Display layout */
  layout?: 'grid' | 'list' | 'inline';
  /** Number of columns for grid layout */
  columns?: 2 | 3 | 4;
  /** Text size */
  size?: 'xs' | 'sm' | 'md';
  /** Whether to show icons */
  showIcons?: boolean;
  /** Additional className */
  className?: string;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  bedrooms,
  bathrooms,
  sqft,
  propertyType,
  yearBuilt,
  lotSize,
  hoaFees,
  propertyTax,
  layout = 'grid',
  columns = 3,
  size = 'xs',
  showIcons = true,
  className = ''
}) => {
  // Size variants
  const sizeStyles = {
    xs: {
      text: 'text-xs',
      icon: 'h-3 w-3'
    },
    sm: {
      text: 'text-sm',
      icon: 'h-4 w-4'
    },
    md: {
      text: 'text-base',
      icon: 'h-5 w-5'
    }
  };

  // Layout variants
  const layoutStyles = {
    grid: `grid grid-cols-${columns} gap-3`,
    list: 'space-y-2',
    inline: 'flex flex-wrap gap-4'
  };

  const currentSizeStyles = sizeStyles[size];
  const currentLayoutStyles = layoutStyles[layout];

  // Helper function to format property type
  const formatPropertyType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  // Helper function to format currency
  const formatCurrency = (value: string | number) => {
    if (typeof value === 'string') {
      return value.startsWith('$') ? value : `$${value}`;
    }
    return `$${value?.toLocaleString() || 'N/A'}`;
  };

  // Detail items configuration
  const details = [
    {
      key: 'bedrooms',
      value: bedrooms,
      label: `${bedrooms || 0} bed${(bedrooms || 0) !== 1 ? 's' : ''}`,
      icon: <Bed className={`${currentSizeStyles.icon} text-brown`} />,
      show: bedrooms !== undefined
    },
    {
      key: 'bathrooms',
      value: bathrooms,
      label: `${bathrooms || 0} bath${(bathrooms || 0) !== 1 ? 's' : ''}`,
      icon: <Bath className={`${currentSizeStyles.icon} text-brown`} />,
      show: bathrooms !== undefined
    },
    {
      key: 'sqft',
      value: sqft,
      label: `${sqft?.toLocaleString() || 0} sqft`,
      icon: <Square className={`${currentSizeStyles.icon} text-brown`} />,
      show: sqft !== undefined
    },
    {
      key: 'propertyType',
      value: propertyType,
      label: formatPropertyType(propertyType || ''),
      icon: <Home className={`${currentSizeStyles.icon} text-brown`} />,
      show: propertyType !== undefined
    },
    {
      key: 'yearBuilt',
      value: yearBuilt,
      label: `Built ${yearBuilt}`,
      icon: <Calendar className={`${currentSizeStyles.icon} text-brown`} />,
      show: yearBuilt !== undefined
    },
    {
      key: 'lotSize',
      value: lotSize,
      label: `Lot: ${lotSize}`,
      icon: <Square className={`${currentSizeStyles.icon} text-brown`} />,
      show: lotSize !== undefined
    },
    {
      key: 'hoaFees',
      value: hoaFees,
      label: `HOA: ${formatCurrency(hoaFees || 0)}`,
      icon: <DollarSign className={`${currentSizeStyles.icon} text-brown`} />,
      show: hoaFees !== undefined
    },
    {
      key: 'propertyTax',
      value: propertyTax,
      label: `Tax: ${formatCurrency(propertyTax || 0)}`,
      icon: <DollarSign className={`${currentSizeStyles.icon} text-brown`} />,
      show: propertyTax !== undefined
    }
  ];

  const visibleDetails = details.filter(detail => detail.show);

  if (visibleDetails.length === 0) {
    return null;
  }

  return (
    <div className={`${currentLayoutStyles} ${className}`}>
      {visibleDetails.map((detail) => (
        <div key={detail.key} className="flex items-center gap-1">
          {showIcons && detail.icon}
          <span className={`${currentSizeStyles.text} text-gray-600`}>
            {detail.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PropertyDetails;
