import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import { authApi } from "../../lib/api";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  PasswordValidation,
  usePasswordValidation,
} from "../../components/feedback/PasswordValidation";
import Input from "../../components/ui/base/Input";
import AuthButton from "../../components/ui/homeauth/AuthButton";
import AuthLink from "../../components/ui/homeauth/AuthLink";
import AuthPageLayout from "../../components/layout/AuthPageLayout";

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

  return (
    <AuthPageLayout 
      title="Create your account" 
      subtitle="Join thousands of users making smarter property decisions"
      logoSize="lg"
      variant="wide"
    >
      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="card space-y-responsive-md">

        <Input
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          placeholder="Enter your full name"
          leftIcon={<UserIcon className="w-4 h-4" />}
          name="name"
          autoComplete="name"
          required
          variant="mobile"
          className="autofill-gold"
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          placeholder="Enter your email"
          leftIcon={<Mail className="w-4 h-4" />}
          name="email"
          autoComplete="email"
          required
          variant="mobile"
          className="autofill-gold"
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Create a password"
            leftIcon={<Lock className="w-4 h-4" />}
            name="password"
            autoComplete="new-password"
            variant="mobile"
            showPasswordToggle
            className="autofill-gold"
          />
          <PasswordValidation
            password={formData.password}
            showValidation={formData.password.length > 0}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <PhoneInput
              international
              defaultCountry="US"
              value={phoneValue}
              onChange={setPhoneValue}
              placeholder="Enter phone number"
              className="w-full h-12 px-4 pl-10 border border-beige rounded-lg bg-white hover:bg-brown/5 focus:ring-2 focus:ring-brown/20 focus:border-brown focus:outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 text-gray-600 text-xs sm:text-sm md:text-base text-left leading-tight touch-friendly mobile-input autofill-gold"
            />
          </div>
        </div>

        {/* Submit */}
        <AuthButton type="submit" loading={loading} disabled={loading}>
          Create account
        </AuthButton>

        <div className="text-center text-signup-mid">
          <span className="text-gray-600 text-signup-mid">Already have an account?</span><AuthLink
            to="/login"
            className="text-brown hover:text-brown/80 hover:underline underline-offset-4 transition-colors"
          >Sign in</AuthLink>
        </div>
      </form>
    </AuthPageLayout>
  );
}
