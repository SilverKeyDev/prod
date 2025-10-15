import { Mail, Lock } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Input } from "../../components/ui";
import { useSecureAuth } from "../../../../packages/hooks/data/useSecureAuth";
import AuthButton from "../../features/homeauth/Auth/Button";
import AuthLink from "../../features/homeauth/Auth/Link";
import AuthPageLayout from "../../features/homeauth/Auth/PageLayout";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";

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
      // Read intended destination from state, sanitize, and fallback
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/dashboard";
      const safe =
        typeof from === "string" &&
        from.startsWith("/") &&
        !from.startsWith("/login")
          ? from
          : "/dashboard";

      console.log(
        "🔐 [LOGIN] Navigating to:",
        safe,
        "Current path:",
        location.pathname
      );

      if (location.pathname !== safe) {
        navigate(safe, { replace: true });
      }
    } else {
      console.log("🔐 [LOGIN] Login failed, not navigating");
    }
  };

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Continue your home search journey"
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleSignInButton text="Sign in with Google" />

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
