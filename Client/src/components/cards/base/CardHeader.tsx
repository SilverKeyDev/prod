import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardHeaderProps {
  /** Icon component */
  icon: LucideIcon;
  /** Title text */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Action button/content */
  action?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Reusable card header with icon, title, subtitle, and action
 */
export default function CardHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  className = ''
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-responsive-sm card-header-spacing ${className}`}>
      <div className="flex items-center gap-responsive-sm flex-1 min-w-0">
        <div className="flex-shrink-0 text-brand-accent">
          <Icon className="mobile-icon-md" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-medium text-responsive-xs leading-tight line-clamp-1 truncate text-brand-primary" title={title}>
            {title}
          </p>
          {subtitle && (
            <p className="text-responsive-xs text-neutral-500 capitalize mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
