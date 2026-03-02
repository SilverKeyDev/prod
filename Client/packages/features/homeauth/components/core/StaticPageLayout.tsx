import React from "react";

import { Link } from "packages/navigation";
import { BodyText, Title } from "packages/ui/components/index.web";

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
    <section className={isLast ? "" : "mb-8"}>
      <Title
        as="h2"
        size="lg"
        className="text-responsive-lg space-y-responsive-sm font-semibold text-black"
      >
        {title}
      </Title>
      {children}
    </section>
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
    <BodyText as="p" className={`space-y-responsive-sm ${className}`}>
      {children}
    </BodyText>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-responsive-sm space-y-responsive-xs list-disc pl-6">{children}</ul>;
}

export function ListItem({ children }: { children: React.ReactNode }) {
  return <li className="space-y-responsive-xs">{children}</li>;
}

export function Bold({ children }: { children: React.ReactNode }) {
  return <strong>{children}</strong>;
}

export function EmailLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      // eslint-disable-next-line silverkey/no-primitive-components -- intentional external link; <a> required for target="_blank"
      <a
        href={href}
        className="text-brown hover:text-brown/80 underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className="text-brown hover:text-brown/80 underline">
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
    <div className="bg-off-white min-h-screen">
      <div className="px-responsive-sm py-responsive-lg mx-auto w-[85%] max-w-4xl">
        <div className="mb-4">
          {centered ? (
            <div className="relative">
              <div className="absolute left-0 top-0">
                <BackButton to={backButtonTo}>{backButtonText}</BackButton>
              </div>
              <div className="py-responsive-md text-center sm:pt-0">
                <Title
                  as="h1"
                  size="xl"
                  className="text-responsive-xl space-y-responsive-xs mt-8 font-bold text-black sm:mt-0"
                >
                  {title}
                </Title>
                {subtitle && (
                  <BodyText as="p" size="sm" className="text-gray-600">
                    {subtitle}
                  </BodyText>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-0 top-0">
                <BackButton to={backButtonTo}>{backButtonText}</BackButton>
              </div>
              <div className="py-responsive-md text-center sm:pt-0">
                <Title
                  as="h1"
                  size="xl"
                  className="text-responsive-xl space-y-responsive-xs mt-8 font-bold text-black sm:mt-0"
                >
                  {title}
                </Title>
                {subtitle && (
                  <BodyText as="p" size="sm" className="text-gray-600">
                    {subtitle}
                  </BodyText>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-responsive-md rounded-xl bg-white shadow-sm">
          <div className="prose text-responsive-sm max-w-none text-gray-700">{children}</div>
        </div>
      </div>
    </div>
  );
}
