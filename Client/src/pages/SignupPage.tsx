import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Phone, ArrowLeft } from "lucide-react";
import { authApi } from "../lib/api";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { PasswordValidation, usePasswordValidation } from "../components/PasswordValidation";
import Loading from "../components/Loading";
import MiniLogo from "../components/MiniLogo";

interface SignupPageProps {}

export default function SignupPage({}: SignupPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agencyName: "",
  });
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Password validation
  const { isValid: isPasswordValid, errors: passwordErrors } = usePasswordValidation(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate password before submission
    if (!isPasswordValid) {
      alert(`Password must meet all requirements: ${passwordErrors.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const { success, error } = await authApi.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: phoneValue || undefined,
        agency_name: formData.agencyName || undefined,
      });

      if (!success) {
        throw new Error(error || "Failed to sign up");
      }

      // Store email and password temporarily for verification auto-login
      localStorage.setItem("signupEmail", formData.email);
      localStorage.setItem("signupPassword", formData.password);
      navigate("/verification", { state: { email: formData.email } });
    } catch (error: unknown) {
      console.error("Signup error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to sign up. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif text-black mb-2 flex items-center justify-center gap-2">
            <MiniLogo size="md" />
            Create your account
          </h2>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="card space-y-4 sm:space-y-5">
          {/* Home Button */}
          <Link
            to="/"
            className="inline-flex items-center text-black/60 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Full name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field pl-10 h-12 sm:h-10 text-base sm:text-sm placeholder:text-base placeholder:sm:text-sm"
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10 h-12 sm:h-10 text-base sm:text-sm"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10 h-12 sm:h-10 text-base sm:text-sm"
                placeholder="Enter password"
                autoComplete="new-password"
                required
              />
            </div>
            <PasswordValidation 
              password={formData.password} 
              showValidation={formData.password.length > 0}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40 z-10" />
              <PhoneInput
                international
                defaultCountry="US"
                value={phoneValue}
                onChange={setPhoneValue}
                placeholder="Enter phone number"
                className="phone-input"
              />
              <style>{`
                .phone-input {
                  width: 100%;
                  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
                  border: 1px solid #d1d5db;
                  border-radius: 0.5rem;
                  font-size: 1rem;
                  line-height: 1.25rem;
                  background-color: white;
                  transition: border-color 0.15s ease-in-out,
                    box-shadow 0.15s ease-in-out;
                  height: 3rem;
                }
                @media (min-width: 640px) {
                  .phone-input {
                    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
                    font-size: 0.875rem;
                    height: 2.5rem;
                  }
                }
                .phone-input:focus {
                  outline: none;
                  border-color: #4a3228;
                  box-shadow: 0 0 0 2px rgba(74, 50, 40, 0.2);
                }
                .PhoneInputCountry {
                  margin-right: 0.5rem;
                }
                .PhoneInputInput {
                  border: none;
                  outline: none;
                  width: 100%;
                  padding: 0.5rem 0;
                }
              `}</style>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed h-12 sm:h-10 text-base sm:text-sm font-semibold"
          >
            {loading ? (
              <div className="shimmer w-20 h-5 rounded mx-auto"></div>
            ) : (
              "Create account"
            )}
          </button>

          <div className="text-center text-sm sm:text-base">
            <span className="text-gray-600 sm:text-black/60">Already have an account? </span>
            <Link
              to="/login"
              className="text-brown hover:text-brown/80 hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-4 pt-6 border-t border-gray-100">
          <div className="flex flex-col items-center justify-center gap-4 text-sm text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-black/60">
              <Link 
                to="/privacy" 
                className="hover:text-black transition-colors hover:underline underline-offset-4 decoration-brown/40"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="hover:text-black transition-colors hover:underline underline-offset-4 decoration-brown/40"
              >
                Terms of Service
              </Link>
              <Link 
                to="/contact" 
                className="hover:text-black transition-colors hover:underline underline-offset-4 decoration-brown/40"
              >
                Contact Us
              </Link>
            </div>
            <p className="text-xs text-black/40">
              © {new Date().getFullYear()} SilverKey. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}