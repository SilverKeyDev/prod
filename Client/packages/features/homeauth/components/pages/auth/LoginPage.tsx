import React, { useState } from "react";

import { Icon } from "@ui/icons";

import { GoogleSignInButton } from "packages/features/homeauth/components/auth";
import AuthDivider from "packages/features/homeauth/components/core/Divider";
import AuthLink from "packages/features/homeauth/components/core/Link";
import AuthPageLayout from "packages/features/homeauth/components/core/PageLayout";
import { useSecureAuth } from "packages/features/homeauth/hooks/data/useSecureAuth";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";
import { getSessionStorage } from "packages/utils/storage";

import { Button, Input } from "@/components/ui";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigate, navigateToPath, getCurrentRoute } = useNavigation();
  const route = getCurrentRoute();
  // Use secure authentication hook
  const { login, isLoading, error, clearError } = useSecureAuth();
  // No token cleanup needed - auth is managed via HTTP-only cookies
  // All authentication state is handled by the server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) {
      // Read intended destination from state, sanitize, and fallback
      const from =
        (
          route.state as {
            from?: {
              pathname?: string;
            };
          } | null
        )?.from?.pathname ?? "/dashboard";
      const safe =
        typeof from === "string" && from.startsWith("/") && !from.startsWith("/login")
          ? from
          : "/dashboard";
      if (route.pathname !== safe) {
        navigateToPath(safe, { replace: true });
      }
    } else if (result.needsVerification) {
      // Redirect to verification page with email (same pattern as signup)
      const session = getSessionStorage();
      session.setItem("signupEmail", email);
      session.setItem("signupPassword", password);
      navigate("VERIFICATION", undefined, { state: { email, fromLogin: true } });
    } else {
      log.error(LOG_CATEGORIES.AUTH, "Login failed, not navigating");
    }
  };
  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Continue your home search journey"
      logoSize="lg"
      showHeader={false}
      error={error ?? undefined}
    >
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="card space-y-responsive-md">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="Enter your email"
          leftIcon={<Icon name="mail" className="h-4 w-4" />}
          name="email"
          id="email"
          autoComplete="email"
          variant="mobile"
          className="autofill-gold"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          placeholder="Enter your password"
          leftIcon={<Icon name="lock" className="h-4 w-4" />}
          name="password"
          id="password"
          autoComplete="current-password"
          variant="mobile"
          showPasswordToggle
          className="autofill-gold"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          Login
        </Button>

        <AuthDivider />

        <GoogleSignInButton text="Sign in with Google" />

        <Box className="gap-responsive-md text-responsive-sm flex items-center justify-center">
          <AuthLink to="/signup" variant="inline">
            Create an account
          </AuthLink>
          <AuthLink to="/forgot-password" variant="inline">
            Forgot password?
          </AuthLink>
        </Box>
      </form>
    </AuthPageLayout>
  );
}
