import { lazy } from "react";
import { Route } from "react-router-dom";

import { ROUTES } from "../../../../packages/schemas/nav";
import { AuthGuard, RedirectIfAuthenticated } from "../guards";

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
const PrivacyPolicy = lazy(
  () => import("../../pages/HomeAuth/PrivacyPolicyPage"),
);
const TermsOfService = lazy(
  () => import("../../pages/HomeAuth/TermsOfServicePage"),
);
const ContactUs = lazy(() => import("../../pages/HomeAuth/ContactUsPage"));

export function PublicRoutes() {
  return [
    /* Root route - redirect authenticated users (e.g. auto-login) to post-login destination */
    <Route
      key="home"
      path={ROUTES.HOME}
      element={
        <RedirectIfAuthenticated>
          <HomePage />
        </RedirectIfAuthenticated>
      }
    />,

    /* Public Routes */
    <Route
      key="signup"
      path={ROUTES.SIGNUP}
      element={
        <AuthGuard requireAuth={false}>
          <SignupPage />
        </AuthGuard>
      }
    />,
    <Route
      key="login"
      path={ROUTES.LOGIN}
      element={
        <AuthGuard requireAuth={false}>
          <LoginPage />
        </AuthGuard>
      }
    />,
    <Route
      key="forgot-password"
      path={ROUTES.FORGOT_PASSWORD}
      element={<ResetPasswordPage />}
    />,
    <Route
      key="onboarding"
      path={ROUTES.ONBOARDING}
      element={<OnboardingPage />}
    />,
    <Route
      key="verification"
      path={ROUTES.VERIFICATION}
      element={<VerificationPage />}
    />,
    <Route key="privacy" path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />,
    <Route key="terms" path={ROUTES.TERMS} element={<TermsOfService />} />,
    <Route key="contact" path={ROUTES.CONTACT} element={<ContactUs />} />,
  ];
}
