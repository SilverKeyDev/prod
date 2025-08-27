import { useState, useEffect } from "react";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { authApi } from "../../lib/api";
import MiniLogo from "../../components/ui/MiniLogo";
import AuthInput from "../../components/ui/AuthInput";
import AuthButton from "../../components/ui/AuthButton";
import AuthLink from "../../components/ui/AuthLink";
import AuthFooter from "../../components/ui/AuthFooter";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      // Hard refresh to ensure clean app state
      window.location.href = "/dashboard";
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
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-serif text-black mb-2 flex items-center justify-center gap-2">
            <MiniLogo size="md" />
            Welcome back
          </h2>
          <p className="text-black/60 font-light text-xs sm:text-sm">
            Generate premium property reports with AI
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Home Button */}
          <AuthLink to="/" variant="back">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-xs font-medium">Back to Home</span>
          </AuthLink>

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

          <AuthButton
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Sign in
          </AuthButton>

          <div className="flex items-center justify-center gap-6 text-sm">
            <AuthLink to="/signup" variant="inline">
              Create an account
            </AuthLink>
            <AuthLink to="/forgot-password" variant="inline">
              Forgot password?
            </AuthLink>
          </div>
        </form>

        <AuthFooter />
      </div>
    </div>
  );
}
