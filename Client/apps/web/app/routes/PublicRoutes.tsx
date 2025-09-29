import { lazy } from "react";
import { Route } from "react-router-dom";

import { AuthGuard } from "../guards";

// Lazy-load public pages
const HomePage = lazy(() => import("../../pages/HomeAuth/HomePage"));
const LoginPage = lazy(() => import("../../pages/HomeAuth/LoginPage"));
const SignupPage = lazy(() => import("../../pages/HomeAuth/SignupPage"));
const ResetPasswordPage = lazy(
  () => import("../../pages/HomeAuth/ResetPasswordPage"),
);
const VerificationPage = lazy(
  () => import("../../pages/HomeAuth/VerificationPage"),
);
const OnboardingPage = lazy(
  () => import("../../pages/HomeAuth/OnboardingPage"),
);
const PrivacyPolicy = lazy(() => import("../../pages/HomeAuth/PrivacyPolicy"));
const TermsOfService = lazy(
  () => import("../../pages/HomeAuth/TermsOfService"),
);
const ContactUs = lazy(() => import("../../pages/HomeAuth/ContactUs"));

export function PublicRoutes() {
  return [
    /* Root route - always show homepage */
    <Route key="home" path="/" element={<HomePage />} />,

    /* Public Routes */
    <Route
      key="signup"
      path="/signup"
      element={
        <AuthGuard requireAuth={false}>
          <SignupPage />
        </AuthGuard>
      }
    />,
    <Route
      key="login"
      path="/login"
      element={
        <AuthGuard requireAuth={false}>
          <LoginPage />
        </AuthGuard>
      }
    />,
    <Route
      key="forgot-password"
      path="/forgot-password"
      element={<ResetPasswordPage />}
    />,
    <Route key="onboarding" path="/onboarding" element={<OnboardingPage />} />,
    <Route
      key="verification"
      path="/verification"
      element={<VerificationPage />}
    />,
    <Route key="privacy" path="/privacy" element={<PrivacyPolicy />} />,
    <Route key="terms" path="/terms" element={<TermsOfService />} />,
    <Route key="contact" path="/contact" element={<ContactUs />} />,
  ];
}
