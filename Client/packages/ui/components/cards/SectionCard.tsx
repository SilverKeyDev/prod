import React from "react";

import { Icon } from "@ui/icons";

import type { IconName } from "packages/ui/types/icons";
type SectionCardProps = {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  iconName?: IconName;
  className?: string;
  titleClassName?: string;
};
export default function SectionCard({
  children,
  title,
  icon,
  iconName,
  className = "",
  titleClassName = "",
}: SectionCardProps) {
  const resolvedIcon =
    icon ?? (iconName ? <Icon name={iconName} className="mobile-icon-sm text-brown" /> : null);
  return (
    <div
      className={`border-border-card-subtle bg-background-surface mb-6 rounded-xl border p-6 shadow-sm ${className}`}
    >
      {title && (
        <div
          className={`text-text-primary mb-4 flex items-center gap-3 text-lg font-semibold ${titleClassName}`}
        >
          {resolvedIcon}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
