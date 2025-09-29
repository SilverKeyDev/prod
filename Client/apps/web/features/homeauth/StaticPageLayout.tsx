import React from "react";

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
      <h2 className="text-responsive-lg space-y-responsive-sm font-semibold text-black">
        {title}
      </h2>
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
  return <p className={`space-y-responsive-sm ${className}`}>{children}</p>;
}

export function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-responsive-sm space-y-responsive-xs list-disc pl-6">
      {children}
    </ul>
  );
}

export function EmailLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="text-brown hover:text-brown/80 underline">
      {children}
    </a>
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
    <div className="min-h-screen bg-off-white">
      <div className="px-responsive-sm py-responsive-lg mx-auto w-[85%] max-w-4xl">
        <div className="mb-4">
          {centered ? (
            <div className="relative">
              <div className="absolute left-0 top-0">
                <BackButton to={backButtonTo}>{backButtonText}</BackButton>
              </div>
              <div className="py-responsive-md text-center sm:pt-0">
                <h1 className="text-responsive-xl space-y-responsive-xs mt-8 font-bold text-black sm:mt-0">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-responsive-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-0 top-0">
                <BackButton to={backButtonTo}>{backButtonText}</BackButton>
              </div>
              <div className="py-responsive-md text-center sm:pt-0">
                <h1 className="text-responsive-xl space-y-responsive-xs mt-8 font-bold text-black sm:mt-0">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-responsive-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-responsive-md rounded-xl bg-white shadow-sm">
          <div className="prose text-responsive-sm max-w-none text-gray-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
