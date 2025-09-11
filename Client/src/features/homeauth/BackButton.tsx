import { ArrowLeft } from "lucide-react";
import AuthLink from "./AuthLink";

interface BackButtonProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export default function BackButton({
  to,
  children,
  className = "",
}: BackButtonProps) {
  return (
    <AuthLink
      to={to}
      variant="back"
      className={`flex items-center whitespace-nowrap ${className}`}
    >
      <ArrowLeft className="mobile-icon-sm mr-2 flex-shrink-0" />
      <span className="text-responsive-xs font-medium">{children}</span>
    </AuthLink>
  );
}
