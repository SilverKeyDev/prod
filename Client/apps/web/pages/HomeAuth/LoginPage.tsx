import { Mail, Lock } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Input } from "../../components/ui";
import { useSecureAuth } from "../../../../packages/hooks/data/useSecureAuth";
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

  // No token cleanup needed - auth is managed via HTTP-only cookies
  // All authentication state is handled by the server

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    console.log("🔐 [LOGIN] Starting login...");
    const success = await login(email, password);
    console.log("🔐 [LOGIN] Login result:", success);

    if (success) {
      // Get the "from" location where user tried to go, or default to dashboard
      const from =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        "/dashboard";

      console.log(
        "🔐 [LOGIN] Navigating to:",
        from,
        "Current path:",
        location.pathname,
      );

      // Only navigate if we're not already at the target
      if (location.pathname !== from) {
        console.log("🔐 [LOGIN] Executing navigation...");
        // Use replace to prevent back button from returning to login
        navigate(from, { replace: true });
      } else {
        console.log("🔐 [LOGIN] Already at target path, skipping navigation");
      }
    } else {
      console.log("🔐 [LOGIN] Login failed, not navigating");
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
