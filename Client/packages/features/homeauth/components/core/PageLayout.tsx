import React from "react";

import { Box } from "packages/ui/components/primitives";

import BackButton from "@/features/homeauth/components/core/BackButton";

import AuthFooter from "./Footer";
import AuthHeader from "./Header";

type AuthPageLayoutProps = {
  // Header configuration
  title: string;
  subtitle?: string;
  logoSize?: "xs" | "sm" | "md" | "lg" | "header";
  showHeader?: boolean;

  // Layout configuration
  variant?: "default" | "wide";

  // Styling configuration
  titleClassName?: string;
  subtitleClassName?: string;
  headerContainerClassName?: string;

  // Content
  children: React.ReactNode;

  // Error handling
  error?: string;
  errorClassName?: string;

  // Back button configuration
  backButtonTo?: string;
  backButtonText?: string;
};

export default function AuthPageLayout({
  title,
  subtitle,
  logoSize = "lg",
  showHeader = true,
  variant = "default",
  titleClassName = "text-responsive-2xl font-serif text-text-primary mb-2 flex items-center justify-center",
  subtitleClassName = "text-text-secondary font-light text-responsive-xs mb-8",
  headerContainerClassName = "text-center space-y-2",
  children,
  error,
  errorClassName = "space-y-responsive-md space-responsive-sm bg-red-50 text-red-600 text-responsive-sm rounded-md",
  backButtonTo = "/",
  backButtonText = "Back to Home",
}: AuthPageLayoutProps) {
  const containerWidth =
    variant === "wide"
      ? "w-full max-w-[90vw] sm:max-w-lg md:max-w-xl"
      : "w-full max-w-[85vw] sm:max-w-md";
  return (
    <Box className="px-responsive-sm py-responsive-md bg-background-base flex min-h-screen items-center justify-center">
      <Box className={containerWidth}>
        {/* Header */}
        {showHeader && (
          <AuthHeader
            title={title}
            subtitle={subtitle}
            logoSize={logoSize}
            titleClassName={titleClassName}
            subtitleClassName={subtitleClassName}
            containerClassName={headerContainerClassName}
          />
        )}

        {/* Error Message */}
        {error && <Box className={errorClassName}>{error}</Box>}

        {/* Content */}
        <Box className="mt-8">
          <BackButton to={backButtonTo} className="mb-4 pl-0">
            {backButtonText}
          </BackButton>
          {children}
        </Box>

        <AuthFooter />
      </Box>
    </Box>
  );
}
