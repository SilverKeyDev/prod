import React from "react";

import { ROUTES } from "packages/navigation";

import { BodyText } from "@/components/ui";

import AuthLink from "./Link";

export type AuthTermsDisclaimerFlow = "login" | "signup";

type AuthTermsDisclaimerProps = {
  flow: AuthTermsDisclaimerFlow;
};

const FLOW_COPY: Record<AuthTermsDisclaimerFlow, string> = {
  login: "signing in",
  signup: "signing up",
};

/**
 * Standard implicit-consent copy shown below auth actions (email + Google).
 */
export function AuthTermsDisclaimer({ flow }: AuthTermsDisclaimerProps) {
  const action = FLOW_COPY[flow];

  return (
    <BodyText as="p" size="xs" className="text-text-secondary/90 text-center leading-relaxed">
      By {action} (including with Google), you agree to our{" "}
      <AuthLink to={ROUTES.TERMS} variant="inline" className="text-text-secondary">
        Terms of Service
      </AuthLink>{" "}
      and{" "}
      <AuthLink to={ROUTES.PRIVACY} variant="inline" className="text-text-secondary">
        Privacy Policy
      </AuthLink>
      .
    </BodyText>
  );
}
