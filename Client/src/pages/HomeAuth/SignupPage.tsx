import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Phone, ArrowLeft } from "lucide-react";
import { authApi } from "../../lib/api";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  PasswordValidation,
  usePasswordValidation,
} from "../../components/feedback/PasswordValidation";
import MiniLogo from "../../components/ui/MiniLogo";
import AuthInput from "../../components/ui/AuthInput";
import AuthButton from "../../components/ui/AuthButton";
import AuthLink from "../../components/ui/AuthLink";
import AuthFooter from "../../components/ui/AuthFooter";

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
  const { isValid: isPasswordValid, errors: passwordErrors } =
    usePasswordValidation(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate password before submission
    if (!isPasswordValid) {
      alert(
        `Password must meet all requirements: ${passwordErrors.join(", ")}`
      );
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
          <h2 className="text-xl sm:text-2xl font-serif text-black mb-2 flex items-center justify-center gap-2">
            <MiniLogo size="md" />
            Create your account
          </h2>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Home Button */}
          <AuthLink to="/" variant="back">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-xs font-medium">Back to Home</span>
          </AuthLink>

          <AuthInput
            label="Full name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            icon={UserIcon}
            autoComplete="name"
            required
          />

          <AuthInput
            label="Email address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            icon={Mail}
            autoComplete="email"
            required
          />

          <div className="mb-6">
            <label className="block text-xs font-medium text-black mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10 h-12 text-sm border-gray-300 focus:border-brown focus:ring-brown/20"
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
          <div className="mb-6">
            <label className="block text-xs font-medium text-black mb-2">
              Phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40 z-10" />
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
                  font-size: 0.875rem;
                  line-height: 1.25rem;
                  background-color: white;
                  transition: border-color 0.15s ease-in-out,
                    box-shadow 0.15s ease-in-out;
                  height: 3rem;
                }
                .phone-input:focus {
                  outline: none;
                  border-color: #92400e;
                  box-shadow: 0 0 0 2px rgba(146, 64, 14, 0.2);
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
          <AuthButton
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Create account
          </AuthButton>

          <div className="text-center text-xs sm:text-sm">
            <span className="text-gray-600 sm:text-black/60">
              Already have an account?{" "}
            </span>
            <AuthLink
              to="/login"
              className="text-brown hover:text-brown/80 hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </AuthLink>
          </div>
        </form>

        <AuthFooter />
      </div>
    </div>
  );
}
