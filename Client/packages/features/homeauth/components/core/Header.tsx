import { Box } from "packages/ui/components/primitives";

import MiniLogo from "@/components/asset/MiniLogo";
import { BodyText, Title } from "@/components/ui";
type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  logoSize?: "xs" | "sm" | "md" | "lg" | "header";
  titleClassName?: string;
  subtitleClassName?: string;
  containerClassName?: string;
};
export default function AuthHeader({
  title,
  subtitle,
  logoSize = "lg",
  titleClassName = "text-responsive-2xl font-serif text-black mb-2 flex flex-row items-center justify-center",
  subtitleClassName = "text-neutral-600 font-light text-responsive-xs mb-8",
  containerClassName = "text-center gap-2",
}: AuthHeaderProps) {
  return (
    <Box className={containerClassName}>
      <Title as="h2" className={titleClassName}>
        <MiniLogo size={logoSize} />
        {title}
      </Title>
      {subtitle && (
        <BodyText as="p" className={subtitleClassName}>
          {subtitle}
        </BodyText>
      )}
    </Box>
  );
}
