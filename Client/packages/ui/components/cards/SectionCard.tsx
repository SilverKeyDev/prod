import React from "react";

import type { LucideIcon } from "lucide-react";

type SectionCardProps = {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  className?: string;
  titleClassName?: string;
};

export default function SectionCard({
  children,
  title,
  icon: Icon,
  className = "",
  titleClassName = "",
}: SectionCardProps) {
  return (
    <div className={`border-beige/40 mb-6 rounded-xl border bg-white p-6 shadow-sm ${className}`}>
      {title && (
        <div
          className={`text-navy mb-4 flex items-center gap-3 text-lg font-semibold ${titleClassName}`}
        >
          {Icon && <Icon className="mobile-icon-sm text-brown" />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
