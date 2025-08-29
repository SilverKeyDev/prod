import React from "react";
import AuthHeader from "../ui/homeauth/AuthHeader";
import AuthFooter from "../ui/homeauth/AuthFooter";
import BackButton from "../ui/homeauth/BackButton";

interface AuthPageLayoutProps {
  // Header configuration
  title: string;
  subtitle?: string;
  logoSize?: "xs" | "sm" | "md" | "lg" | "header";
  
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
}

export default function AuthPageLayout({
  title,
  subtitle,
  logoSize = "lg",
  variant = "default",
  titleClassName = "text-responsive-2xl font-serif text-black mb-2 flex items-center justify-center",
  subtitleClassName = "text-black/60 font-light text-responsive-xs mb-8",
  headerContainerClassName = "text-center space-y-2",
  children,
  error,
  errorClassName = "space-y-responsive-md space-responsive-sm bg-red-50 text-red-600 text-responsive-sm rounded-md"
}: AuthPageLayoutProps) {
  const containerWidth = variant === "wide" 
    ? "w-full max-w-[90vw] sm:max-w-lg md:max-w-xl"
    : "w-full max-w-[85vw] sm:max-w-md";
  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-responsive-sm py-responsive-md">
      <div className={containerWidth}>
        {/* Header */}
        <AuthHeader
          title={title}
          subtitle={subtitle}
          logoSize={logoSize}
          titleClassName={titleClassName}
          subtitleClassName={subtitleClassName}
          containerClassName={headerContainerClassName}
        />

        {/* Error Message */}
        {error && (
          <div className={errorClassName}>
            {error}
          </div>
        )}

        {/* Content */}
        <div className="mt-8">
          <BackButton to="/" className="mb-4 pl-0">
            Back to Home
          </BackButton>
          {children}
        </div>

        <AuthFooter />
      </div>
    </div>
  );
}
