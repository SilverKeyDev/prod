import React from "react";
import { Shield, Key, Link2 } from "lucide-react";
import type { AuthMethod } from "../../../../packages/schemas/user";

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
  const getAuthMethodInfo = () => {
    switch (authMethod) {
      case "google":
        return {
          icon: <Shield className="h-4 w-4" />,
          label: "Google OAuth",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          description:
            "You signed up with Google. Sign in using the 'Continue with Google' button.",
          limitation:
            "Password reset and email verification are not available for Google OAuth accounts.",
        };
      case "cognito":
        return {
          icon: <Key className="h-4 w-4" />,
          label: "Email & Password",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          description: "You signed up with email and password.",
          suggestion: "You can link your Google account for easier sign-in.",
        };
      case "both":
        return {
          icon: <Link2 className="h-4 w-4" />,
          label: "Linked Account",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          description:
            "Your account is linked to both email/password and Google.",
          benefit:
            "You can sign in using either method for maximum flexibility.",
        };
      default:
        return {
          icon: <Shield className="h-4 w-4" />,
          label: "Unknown",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          description: "Authentication method not detected.",
          suggestion: "Please contact support if you experience any issues.",
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
        <span className="font-medium">{authInfo.label}</span>
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
          <h3 className={`text-sm font-semibold ${authInfo.color}`}>
            {authInfo.label}
          </h3>
          <p className="mt-1 text-sm text-gray-700">{authInfo.description}</p>

          {authInfo.limitation && (
            <p className="mt-2 text-xs text-gray-600">
              ⚠️ {authInfo.limitation}
            </p>
          )}

          {authInfo.suggestion && (
            <p className="mt-2 text-xs text-gray-600">
              💡 {authInfo.suggestion}
            </p>
          )}

          {authInfo.benefit && (
            <p className="mt-2 text-xs text-gray-600">✅ {authInfo.benefit}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthMethodIndicator;
