import React from "react";

import { Link } from "packages/navigation";

type AuthLinkProps = {
  to: string;
  children: React.ReactNode;
  variant?: "footer" | "inline" | "back";
  className?: string;
};

export default function AuthLink({
  to,
  children,
  variant = "footer",
  className = "",
}: AuthLinkProps) {
  const baseClasses = "transition-colors";

  const variantClasses = {
    footer:
      "text-text-secondary hover:text-black text-xs sm:text-sm px-responsive-sm transition-all duration-200",
    inline: "text-text-secondary hover:text-text-primary text-xs sm:text-sm",
    back: "inline-flex items-center text-text-secondary hover:text-black mb-4",
  };

  return (
    <Link
      to={to}
      className={`${baseClasses} ${variantClasses[variant]} ${className} decoration-1 underline-offset-2 hover:underline`}
    >
      {children}
    </Link>
  );
}
