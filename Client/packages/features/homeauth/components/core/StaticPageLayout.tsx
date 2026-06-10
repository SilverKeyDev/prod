import type { ReactNode } from "react";

import { Link, ROUTES } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";
import Region from "packages/ui/components/system/accessibility/Region";

import { BodyText, Title } from "@/components/ui";

import BackButton from "./BackButton";

type SectionProps = {
  title: string;
  children: ReactNode;
  isLast?: boolean;
};

export type LegalSuiteActive = "privacy" | "terms" | "contact";

type StaticPageLayoutProps = {
  title: string;
  subtitle?: string;
  backButtonTo?: string;
  backButtonText?: string;
  children: ReactNode;
  /** When set, shows Privacy / Terms / Contact shortcuts (current page emphasized). */
  legalSuiteActive?: LegalSuiteActive;
};

const LEGAL_SUITE_LINKS: {
  key: LegalSuiteActive;
  label: string;
  to: string;
}[] = [
  { key: "privacy", label: "Privacy policy", to: ROUTES.PRIVACY },
  { key: "terms", label: "Terms of service", to: ROUTES.TERMS },
  { key: "contact", label: "Contact", to: ROUTES.CONTACT },
];

function LegalSuiteNav({ active }: { active: LegalSuiteActive }) {
  return (
    <Region
      role="navigation"
      label="Legal pages"
      className="border-border flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-4"
    >
      {LEGAL_SUITE_LINKS.map((item) =>
        item.key === active ? (
          <BodyText as="span" key={item.key} size="sm" className="text-text-primary font-semibold">
            {item.label}
          </BodyText>
        ) : (
          <Link
            key={item.key}
            to={item.to}
            className="text-text-secondary hover:text-text-primary text-sm font-medium motion-safe:transition-colors"
          >
            {item.label}
          </Link>
        )
      )}
    </Region>
  );
}

export function Section({ title, children, isLast = false }: SectionProps) {
  return (
    <Box className={isLast ? "space-y-4" : "mb-10 space-y-4"}>
      <Title as="h2" size="md" className="text-text-primary font-semibold">
        {title}
      </Title>
      <Box className="space-y-3">{children}</Box>
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
    <BodyText as="p" size="sm" muted className={`leading-relaxed ${className}`}>
      {children}
    </BodyText>
  );
}

export function List({ children }: { children: ReactNode }) {
  return (
    <ul className="text-text-secondary list-outside list-disc space-y-2 pl-6 text-sm leading-relaxed">
      {children}
    </ul>
  );
}

export function ListItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function Bold({ children }: { children: ReactNode }) {
  return (
    <BodyText as="span" size="sm" className="text-text-primary font-semibold">
      {children}
    </BodyText>
  );
}

export function EmailLink({ href, children }: { href: string; children: ReactNode }) {
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return (
      // eslint-disable-next-line silverkey/no-primitive-components -- mailto/tel/http require native anchor
      <a
        href={href}
        className="text-brand-accent hover:text-brand-accent/90 underline underline-offset-2 motion-safe:transition-colors"
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        target={href.startsWith("http") ? "_blank" : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      to={href}
      className="text-brand-accent hover:text-brand-accent/90 underline underline-offset-2 motion-safe:transition-colors"
    >
      {children}
    </Link>
  );
}

export default function StaticPageLayout({
  title,
  subtitle,
  backButtonTo = "/",
  backButtonText = "Back to home",
  children,
  legalSuiteActive,
}: StaticPageLayoutProps) {
  return (
    <Box className="bg-background-base min-h-0 flex-1">
      <Box className="px-responsive-sm mx-auto w-full max-w-3xl py-8 md:py-12">
        <Box className="mb-8 flex flex-col gap-6">
          <BackButton to={backButtonTo}>{backButtonText}</BackButton>
          {legalSuiteActive ? <LegalSuiteNav active={legalSuiteActive} /> : null}
          <Box>
            <Title
              as="h1"
              size="lg"
              className="text-text-primary mb-2 text-left font-semibold md:text-2xl"
            >
              {title}
            </Title>
            {subtitle ? (
              <BodyText as="p" size="sm" muted>
                {subtitle}
              </BodyText>
            ) : null}
          </Box>
        </Box>

        <Box className="border-border bg-background-surface rounded-xl border p-6 shadow-sm md:p-10">
          {children}
        </Box>
      </Box>
    </Box>
  );
}
