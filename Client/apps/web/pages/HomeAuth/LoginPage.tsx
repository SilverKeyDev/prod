import { Mail, Lock } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Button, Input } from "../../components/ui";
import { useSecureAuth } from "../../../../packages/hooks/data/useSecureAuth";
import AuthDivider from "../../features/homeauth/Auth/Divider";
import AuthLink from "../../features/homeauth/Auth/Link";
import AuthPageLayout from "../../features/homeauth/Auth/PageLayout";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Use secure authentication hook
  const { login, isLoading, error, clearError, needsVerification } =
    useSecureAuth();

  // No token cleanup needed - auth is managed via HTTP-only cookies
  // All authentication state is handled by the server

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const result = await login(email, password);

    if (result.success) {
      // Read intended destination from state, sanitize, and fallback
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/search";
      const safe =
        typeof from === "string" &&
        from.startsWith("/") &&
        !from.startsWith("/login")
          ? from
          : "/search";

      if (location.pathname !== safe) {
        navigate(safe, { replace: true });
      }
    } else if (result.needsVerification) {
      // Redirect to verification page with email (same pattern as signup)
      localStorage.setItem("signupEmail", email);
      localStorage.setItem("signupPassword", password);
      navigate("/verification", { state: { email, fromLogin: true } });
    } else {
      console.error("🔐 [LOGIN] Login failed, not navigating");
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

        <Button
          type="submit"
          variant="olive"
          size="md"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          Login
        </Button>

        <AuthDivider />

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
