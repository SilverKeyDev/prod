import { Mail, Lock } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Input } from "../../components/ui";
import { useSecureAuth } from "../../core/hooks/data/useSecureAuth";
import AuthButton from "../../features/homeauth/Auth/Button";
import AuthLink from "../../features/homeauth/Auth/Link";
import AuthPageLayout from "../../features/homeauth/Auth/PageLayout";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Use secure authentication hook
  const { login, isLoading, error, clearError } = useSecureAuth();

  // Only clear auth data if user is not authenticated and there are stale tokens
  useEffect(() => {
    // Check if user is already authenticated via secure auth hook
    const hasValidAuth = (
      window as unknown as { getSecureAccessToken?: () => string | null }
    ).getSecureAccessToken?.();

    // Only clear tokens if there's no valid authentication
    if (!hasValidAuth) {
      const hasTokens =
        sessionStorage.getItem("refresh_token") ??
        sessionStorage.getItem("access_token") ??
        sessionStorage.getItem("user");

      if (hasTokens) {
        // Clear stale tokens from sessionStorage
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        clearError();
      }
    }
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await login(email, password);

    if (success) {
      // Get the intended destination from location state or default to dashboard
      // Type-safe location state access with proper type guards
      const locationState = location.state as {
        from?: { pathname?: string };
      } | null;
      const from = locationState?.from?.pathname ?? "/dashboard";

      // Navigate immediately - store is updated synchronously in login function
      navigate(from, { replace: true });
    } else {
      console.log("🔐 [LOGIN] Login failed, staying on login page");
    }
  };

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Generate premium property reports with AI"
      logoSize="lg"
      error={error ?? undefined}
    >
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="card space-y-responsive-md">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          placeholder="Enter your email"
          leftIcon={<Mail className="h-4 w-4" />}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          placeholder="Enter your password"
          leftIcon={<Lock className="h-4 w-4" />}
          name="password"
          id="password"
          autoComplete="current-password"
          variant="mobile"
          showPasswordToggle
          className="autofill-gold"
        />

        <AuthButton type="submit" loading={isLoading} disabled={isLoading}>
          Login
        </AuthButton>

        <div className="gap-responsive-md text-responsive-sm flex items-center justify-center">
          <AuthLink to="/signup" variant="inline">
            Create an account
          </AuthLink>
          <AuthLink to="/forgot-password" variant="inline">
            Forgot password?
          </AuthLink>
        </div>
      </form>
    </AuthPageLayout>
  );
}
