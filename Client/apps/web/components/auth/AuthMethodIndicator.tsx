import React from "react";

import { Key, Link2, Shield } from "lucide-react";

import { useLocalization } from "packages/contexts";
import type { AuthMethod } from "packages/schemas/app/auth/user";

import { BodyText, Title } from "@/components/ui/index.web";

interface AuthMethodIndicatorProps {
  authMethod?: AuthMethod;
  showDetails?: boolean;
  className?: string;
}

const AuthMethodIndicator: React.FC<AuthMethodIndicatorProps> = ({
  authMethod = "unknown",
  showDetails = true,
  className = "",
}) => {
  const { t } = useLocalization();

  const getAuthMethodInfo = () => {
    switch (authMethod) {
      case "google":
        return {
          icon: <Shield className="h-4 w-4" />,
          labelKey: "auth.method.google_oauth",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          descriptionKey: "auth.description.google",
          limitationKey: "auth.limitation.google",
        };
      case "cognito":
        return {
          icon: <Key className="h-4 w-4" />,
          labelKey: "auth.method.email_password",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          descriptionKey: "auth.description.cognito",
          suggestionKey: "auth.suggestion.cognito",
        };
      case "both":
        return {
          icon: <Link2 className="h-4 w-4" />,
          labelKey: "auth.method.linked",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          descriptionKey: "auth.description.both",
          benefitKey: "auth.benefit.both",
        };
      default:
        return {
          icon: <Shield className="h-4 w-4" />,
          labelKey: "auth.method.unknown",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          descriptionKey: "auth.description.unknown",
          suggestionKey: "auth.suggestion.unknown",
        };
    }
  };

  const authInfo = getAuthMethodInfo();

  if (!showDetails) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${authInfo.bgColor} ${authInfo.color} ${className}`}
      >
        {authInfo.icon}
        <BodyText as="span" className="font-medium">
          {t(authInfo.labelKey)}
        </BodyText>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 ${authInfo.bgColor} ${authInfo.borderColor} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${authInfo.color}`}>{authInfo.icon}</div>
        <div className="flex-1">
          <Title
            as="h3"
            size="sm"
            className={`font-semibold ${authInfo.color}`}
          >
            {t(authInfo.labelKey)}
          </Title>
          <BodyText as="p" size="sm" className="mt-1 text-gray-700">
            {t(authInfo.descriptionKey)}
          </BodyText>

          {"limitationKey" in authInfo && authInfo.limitationKey && (
            <BodyText as="p" size="xs" className="mt-2 text-gray-600">
              {t("auth.limitation.google_display")}
            </BodyText>
          )}

          {"suggestionKey" in authInfo && authInfo.suggestionKey && (
            <BodyText as="p" size="xs" className="mt-2 text-gray-600">
              {authInfo.suggestionKey === "auth.suggestion.cognito"
                ? t("auth.suggestion.cognito_display")
                : t("auth.suggestion.unknown_display")}
            </BodyText>
          )}

          {"benefitKey" in authInfo && authInfo.benefitKey && (
            <BodyText as="p" size="xs" className="mt-2 text-gray-600">
              {t("auth.benefit.both_display")}
            </BodyText>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthMethodIndicator;
