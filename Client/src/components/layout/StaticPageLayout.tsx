import React from "react";
import BackButton from "../ui/homeauth/BackButton";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
}

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  backButtonTo?: string;
  backButtonText?: string;
  children: React.ReactNode;
  centered?: boolean;
}

export function Section({ title, children, isLast = false }: SectionProps) {
  return (
    <section className={isLast ? "" : "mb-8"}>
      <h2 className="text-responsive-lg font-semibold text-black space-y-responsive-sm">{title}</h2>
      {children}
    </section>
  );
}

export function Paragraph({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`space-y-responsive-sm ${className}`}>
      {children}
    </p>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-6 space-y-responsive-sm space-y-responsive-xs">
      {children}
    </ul>
  );
}

export function EmailLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-black hover:underline">
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
      <div className="w-[85%] max-w-4xl mx-auto px-responsive-sm py-responsive-lg">
        <div className="mb-4">
          {centered ? (
            <div className="relative">
              <div className="absolute top-0 left-0">
                <BackButton to={backButtonTo}>{backButtonText}</BackButton>
              </div>
              <div className="text-center py-responsive-md sm:pt-0">
                <h1 className="text-responsive-xl font-bold text-black space-y-responsive-xs mt-8 sm:mt-0">{title}</h1>
                {subtitle && (
                  <p className="text-responsive-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-0 left-0">
                <BackButton to={backButtonTo}>{backButtonText}</BackButton>
              </div>
              <div className="text-center py-responsive-md sm:pt-0">
                <h1 className="text-responsive-xl font-bold text-black space-y-responsive-xs mt-8 sm:mt-0">{title}</h1>
                {subtitle && (
                  <p className="text-responsive-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm space-responsive-md">
          <div className="prose max-w-none text-responsive-sm text-gray-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
