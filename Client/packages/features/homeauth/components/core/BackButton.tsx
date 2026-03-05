import { Icon } from "@ui/icons";

import AuthLink from "./Link";
type BackButtonProps = {
  to: string;
  children: React.ReactNode;
  className?: string;
};
export default function BackButton({ to, children, className = "" }: BackButtonProps) {
  return (
    <AuthLink to={to} variant="back" className={`flex items-center whitespace-nowrap ${className}`}>
      <Icon name="arrow-left" className="mobile-icon-sm mr-2 flex-shrink-0" />
      {children}
    </AuthLink>
  );
}
