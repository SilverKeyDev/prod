import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { AuthMethod } from "packages/features/homeauth/types";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Title } from "@/components/ui";
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
          icon: <Icon name="shield" className="h-4 w-4" />,
          labelKey: "auth.method.google_oauth",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          descriptionKey: "auth.description.google",
          limitationKey: "auth.limitation.google",
        };
      case "cognito":
        return {
          icon: <Icon name="key" className="h-4 w-4" />,
          labelKey: "auth.method.email_password",
          color: "text-accent",
          bgColor: "bg-accent-muted",
          borderColor: "border-border",
          descriptionKey: "auth.description.cognito",
          suggestionKey: "auth.suggestion.cognito",
        };
      case "both":
        return {
          icon: <Icon name="link-2" className="h-4 w-4" />,
          labelKey: "auth.method.linked",
          color: "text-accent",
          bgColor: "bg-accent-muted",
          borderColor: "border-border",
          descriptionKey: "auth.description.both",
          benefitKey: "auth.benefit.both",
        };
      default:
        return {
          icon: <Icon name="shield" className="h-4 w-4" />,
          labelKey: "auth.method.unknown",
          color: "text-text-secondary",
          bgColor: "bg-background-base",
          borderColor: "border-border",
          descriptionKey: "auth.description.unknown",
          suggestionKey: "auth.suggestion.unknown",
        };
    }
  };
  const authInfo = getAuthMethodInfo();
  if (!showDetails) {
    return (
      <Box
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${authInfo.bgColor} ${authInfo.color} ${className}`}
      >
        {authInfo.icon}
        <BodyText as="span" className="font-medium">
          {t(authInfo.labelKey)}
        </BodyText>
      </Box>
    );
  }
  return (
    <Box
      className={`rounded-lg border p-4 ${authInfo.bgColor} ${authInfo.borderColor} ${className}`}
    >
      <Box className="flex items-start gap-3">
        <Box className={`mt-0.5 ${authInfo.color}`}>{authInfo.icon}</Box>
        <Box className="flex-1">
          <Title as="h3" size="sm" className={`font-semibold ${authInfo.color}`}>
            {t(authInfo.labelKey)}
          </Title>
          <BodyText as="p" size="sm" className="text-text-secondary mt-1">
            {t(authInfo.descriptionKey)}
          </BodyText>

          {"limitationKey" in authInfo && authInfo.limitationKey && (
            <BodyText as="p" size="xs" className="text-text-secondary mt-2">
              {t("auth.limitation.google_display")}
            </BodyText>
          )}

          {"suggestionKey" in authInfo && authInfo.suggestionKey && (
            <BodyText as="p" size="xs" className="text-text-secondary mt-2">
              {authInfo.suggestionKey === "auth.suggestion.cognito"
                ? t("auth.suggestion.cognito_display")
                : t("auth.suggestion.unknown_display")}
            </BodyText>
          )}

          {"benefitKey" in authInfo && authInfo.benefitKey && (
            <BodyText as="p" size="xs" className="text-text-secondary mt-2">
              {t("auth.benefit.both_display")}
            </BodyText>
          )}
        </Box>
      </Box>
    </Box>
  );
};
export default AuthMethodIndicator;
