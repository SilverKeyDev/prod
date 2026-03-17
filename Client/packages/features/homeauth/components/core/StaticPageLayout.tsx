import React from "react";

import { Link } from "packages/navigation";
import { Box, Text } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";

import BackButton from "./BackButton";

type SectionProps = {
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
};

type StaticPageLayoutProps = {
  title: string;
  subtitle?: string;
  backButtonTo?: string;
  backButtonText?: string;
  children: React.ReactNode;
  centered?: boolean;
};

export function Section({ title, children, isLast = false }: SectionProps) {
  return (
    <Box className={isLast ? "" : "mb-8"}>
      <Title
        as="h2"
        size="lg"
        className="text-responsive-lg text-text-primary flex flex-col gap-2 font-semibold"
      >
        {title}
      </Title>
      {children}
    </Box>
  );
}

export function Paragraph({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BodyText as="p" className={`flex flex-col gap-2 ${className}`}>
      {children}
    </BodyText>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <Box className="flex list-disc flex-col gap-1 gap-2 pl-6">{children}</Box>;
}

export function ListItem({ children }: { children: React.ReactNode }) {
  return <Text className="flex flex-col gap-1">{children}</Text>;
}

export function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontWeight: "bold" }}>{children}</Text>;
}

export function EmailLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      // eslint-disable-next-line silverkey/no-primitive-components -- intentional external link; <a> required for target="_blank"
      <a
        href={href}
        className="text-foreground hover:text-text-secondary active:text-text-secondary underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      to={href}
      className="text-foreground hover:text-text-secondary active:text-text-secondary underline"
    >
      {children}
    </Link>
  );
}

export default function StaticPageLayout({
  title,
  subtitle,
  backButtonTo = "/",
  backButtonText = "Back to Home",
  children,
  centered = false,
}: StaticPageLayoutProps) {
  return (
    <Box className="bg-background-base min-h-0 flex-1">
      <Box className="px-responsive-sm py-responsive-lg w-[85%] max-w-4xl self-center">
        <Box className="mb-4">
          {centered ? (
            <Box className="relative">
              <Box className="absolute left-0 top-0">
                <BackButton to={backButtonTo}>{backButtonText}</BackButton>
              </Box>
              <Box className="py-responsive-md text-center sm:pt-0">
                <Title
                  as="h1"
                  size="xl"
                  className="text-responsive-xl text-text-primary mt-8 flex flex-col gap-1 text-center font-bold sm:mt-0"
                >
                  {title}
                </Title>
                {subtitle && (
                  <BodyText as="p" size="sm" className="text-text-secondary">
                    {subtitle}
                  </BodyText>
                )}
              </Box>
            </Box>
          ) : (
            <Box className="relative">
              <Box className="absolute left-0 top-0">
                <BackButton to={backButtonTo}>{backButtonText}</BackButton>
              </Box>
              <Box className="py-responsive-md text-center sm:pt-0">
                <Title
                  as="h1"
                  size="xl"
                  className="text-responsive-xl text-text-primary mt-8 flex flex-col gap-1 text-center font-bold sm:mt-0"
                >
                  {title}
                </Title>
                {subtitle && (
                  <BodyText as="p" size="sm" className="text-text-secondary">
                    {subtitle}
                  </BodyText>
                )}
              </Box>
            </Box>
          )}
        </Box>

        <Box className="space-responsive-md bg-background-surface rounded-xl shadow-sm">
          <Box className="prose text-responsive-sm text-text-secondary max-w-none">{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
