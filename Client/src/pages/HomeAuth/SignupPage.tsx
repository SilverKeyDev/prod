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
import AuthInput from "../../components/ui/homeauth/AuthInput";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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

        <div className="space-y-1">
          <AuthInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            icon={Lock}
            autoComplete="new-password"
            required
          />
          <PasswordValidation
            password={formData.password}
            showValidation={formData.password.length > 0}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="block text-responsive-sm font-semibold text-black/60">
            Phone number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 mobile-icon-xs text-black/40 z-10" />
            <PhoneInput
              international
              defaultCountry="US"
              value={phoneValue}
              onChange={setPhoneValue}
              placeholder="Enter phone number"
              className="input-field pl-10 btn-responsive-md text-responsive-xs border-gray-300 focus:border-brown focus:ring-brown/20 placeholder:font-light"
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
