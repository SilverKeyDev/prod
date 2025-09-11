import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useSecureAuth } from "../../hooks/useSecureAuth";
import AuthPageLayout from "../../features/homeauth/AuthPageLayout";
import { Input } from "../../components/ui";
import AuthButton from "../../features/homeauth/AuthButton";
import AuthLink from "../../features/homeauth/AuthLink";

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
    const hasValidAuth =
      (window as any).getSecureAccessToken &&
      (window as any).getSecureAccessToken();

    // Only clear tokens if there's no valid authentication
    if (!hasValidAuth) {
      const hasTokens =
        sessionStorage.getItem("refresh_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("id_token") ||
        localStorage.getItem("user");

      if (hasTokens) {
        // Clear stale tokens
        sessionStorage.removeItem("refresh_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("id_token");
        localStorage.removeItem("user");
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
      const from = (location.state as any)?.from?.pathname || "/dashboard";

      console.log("🔐 [LOGIN] Login successful, navigating to:", from);
      // Navigate to intended destination or dashboard
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
      error={error || undefined}
    >
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="card space-y-responsive-md">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          leftIcon={<Mail className="w-4 h-4" />}
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
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          leftIcon={<Lock className="w-4 h-4" />}
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

        <div className="flex items-center justify-center gap-responsive-md text-responsive-sm">
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
