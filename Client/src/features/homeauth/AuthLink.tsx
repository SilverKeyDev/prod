import React from "react";
import { Link } from "react-router-dom";

interface AuthLinkProps {
  to: string;
  children: React.ReactNode;
  variant?: "footer" | "inline" | "back";
  className?: string;
}

export default function AuthLink({
  to,
  children,
  variant = "footer",
  className = "",
}: AuthLinkProps) {
  const baseClasses = "transition-colors";

  const variantClasses = {
    footer:
      "text-black/60 hover:text-black text-xs sm:text-sm px-responsive-sm transition-all duration-200",
    inline: "text-gray-600 hover:text-gray-800 text-xs sm:text-sm",
    back: "inline-flex items-center text-black/60 hover:text-black mb-4",
  };

  return (
    <Link
      to={to}
      className={`${baseClasses} ${variantClasses[variant]} ${className} hover:underline underline-offset-2 decoration-1`}
    >
      {children}
    </Link>
  );
}
