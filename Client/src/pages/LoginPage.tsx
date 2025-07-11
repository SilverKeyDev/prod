import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { authApi } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { success, error, data } = await authApi.login(email, password);

      if (!success) {
        throw new Error(error || 'Login failed');
      }

      // Store user data in local storage
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Store access token if available
      if (data?.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }

      if (data?.id_token) {
        localStorage.setItem('id_token', data.id_token);
      }      

      // Redirect to dashboard on successful login
      navigate("/dashboard");
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-navy mb-2">Welcome back</h2>
          <p className="text-navy/60 font-light">
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
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter your email"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="shimmer w-16 h-5 rounded mx-auto"></div>
            ) : (
              "Sign in"
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link
              to="/signup"
              className="text-navy hover:text-navy-light transition-colors"
            >
              Create an account
            </Link>
            <Link
              to="/forgot-password"
              className="text-navy hover:text-navy-light transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-6 text-navy/60">
              <Link 
                to="/privacy" 
                className="hover:text-brown transition-colors hover:underline underline-offset-4 decoration-brown/40"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="hover:text-brown transition-colors hover:underline underline-offset-4 decoration-brown/40"
              >
                Terms of Service
              </Link>
            </div>
            <span className="hidden sm:inline-block h-4 w-px bg-gray-200"></span>
            <p className="text-xs text-navy/40">
              © {new Date().getFullYear()} SilverKey. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
