import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { authApi } from "../../lib/api";
import AuthPageLayout from "../../components/layout/AuthPageLayout";
import AuthInput from "../../components/ui/homeauth/AuthInput";
import AuthButton from "../../components/ui/homeauth/AuthButton";
import AuthLink from "../../components/ui/homeauth/AuthLink";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Clear any existing auth data when login page loads
  useEffect(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");

    // Dispatch auth change event to update App component state
    window.dispatchEvent(new Event("authChange"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { success, error, data } = await authApi.login(email, password);

      if (!success) {
        throw new Error(error || "Login failed");
      }

      // Store user data in local storage
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Store access token if available
      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }

      if (data?.id_token) {
        localStorage.setItem("id_token", data.id_token);
      }

      // Dispatch auth change event to update App component state
      window.dispatchEvent(new Event("authChange"));

      // Get the intended destination from location state or default to dashboard
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      
      // Navigate to intended destination or dashboard
      navigate(from, { replace: true });
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Generate premium property reports with AI"
      logoSize="lg"
      error={error}
    >
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="card space-y-responsive-md">

        <AuthInput
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          icon={Mail}
          autoComplete="username"
          required
        />

        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          icon={Lock}
          autoComplete="current-password"
          required
        />

        <AuthButton type="submit" loading={loading} disabled={loading}>
          Sign in
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
