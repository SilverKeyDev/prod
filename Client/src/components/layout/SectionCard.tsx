import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  className?: string;
  titleClassName?: string;
}

export default function SectionCard({ 
  children, 
  title, 
  icon: Icon,
  className = '',
  titleClassName = ''
}: SectionCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40 ${className}`}>
      {title && (
        <div className={`text-lg font-semibold text-navy flex items-center gap-3 mb-4 ${titleClassName}`}>
          {Icon && <Icon className="mobile-icon-sm text-brown" />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
