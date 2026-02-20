import { lazy } from "react";

import { Route } from "react-router-dom";

import { ROUTES } from "packages/schemas/app/nav";

import { AuthGuard, RedirectIfAuthenticated } from "@/app/guards";

// Lazy-load public pages
const HomePage = lazy(() => import("../../pages/HomeAuth/homepage/HomePage"));
const LoginPage = lazy(() => import("../../pages/HomeAuth/auth/LoginPage"));
const SignupPage = lazy(() => import("../../pages/HomeAuth/auth/SignupPage"));
const ResetPasswordPage = lazy(
  () => import("../../pages/HomeAuth/password/ResetPasswordPage"),
);
const VerificationPage = lazy(
  () => import("../../pages/HomeAuth/verification/VerificationPage"),
);
const OnboardingPage = lazy(
  () => import("../../pages/HomeAuth/OnboardingPage"),
);
const PrivacyPolicy = lazy(
  () => import("../../pages/HomeAuth/legal/PrivacyPolicyPage"),
);
const TermsOfService = lazy(
  () => import("../../pages/HomeAuth/legal/TermsOfServicePage"),
);
const ContactUs = lazy(
  () => import("../../pages/HomeAuth/legal/ContactUsPage"),
);
const ButtonShowcasePage = lazy(() => import("../../pages/ButtonShowcasePage"));

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

    /* Dev: Button visual regression showcase */
    <Route
      key="button-showcase"
      path="/button-showcase"
      element={<ButtonShowcasePage />}
    />,
  ];
}
