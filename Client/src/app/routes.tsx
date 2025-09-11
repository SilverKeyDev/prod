import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { ProtectedRoute, AuthGuard } from "./guards";
import { UserProfile } from "../context"; // consider importing from a /types module instead

// Lazy-load public pages
const HomePage = lazy(() => import("../pages/HomeAuth/HomePage"));
const LoginPage = lazy(() => import("../pages/HomeAuth/LoginPage"));
const SignupPage = lazy(() => import("../pages/HomeAuth/SignupPage"));
const ResetPasswordPage = lazy(
  () => import("../pages/HomeAuth/ResetPasswordPage"),
);
const VerificationPage = lazy(
  () => import("../pages/HomeAuth/VerificationPage"),
);
const OnboardingPage = lazy(() => import("../pages/HomeAuth/OnboardingPage"));
const PrivacyPolicy = lazy(() => import("../pages/HomeAuth/PrivacyPolicy"));
const TermsOfService = lazy(() => import("../pages/HomeAuth/TermsOfService"));
const ContactUs = lazy(() => import("../pages/HomeAuth/ContactUs"));

interface AppRoutesProps {
  user: UserProfile | null;
  handleLogout: () => void;
}

// Wrapper so the protected layout is defined once
function ProtectedDashboard({
  user,
  onLogout,
}: {
  user?: UserProfile;
  onLogout: () => void;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout user={user} onLogout={onLogout} />
    </ProtectedRoute>
  );
}

// List all protected base paths here
const PROTECTED_BASE_PATHS = [
  "/dashboard/*",
  "/search/*",
  "/saved/*",
  "/reports/*",
  "/generate-report/*",
  "/compare-reports/*",
  "/ai-assistant/*",
  "/personalization/*",
  "/subscription/*",
  "/negotiation-strategy/*",
  "/escrow-legal-logistics/*",
  "/inspections-due-diligence/*",
  "/financing-insurance/*",
  "/closing-moving-in/*",
  "/client-information/*",
  "/agent-connection/*",
  "/close/*",
];

export function AppRoutes({ user, handleLogout }: AppRoutesProps) {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-gray-600">Loading…</div>}
    >
      <Routes>
        {/* Root route - always show homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Public Routes */}
        <Route
          path="/signup"
          element={
            <AuthGuard requireAuth={false}>
              <SignupPage />
            </AuthGuard>
          }
        />
        <Route
          path="/login"
          element={
            <AuthGuard requireAuth={false}>
              <LoginPage />
            </AuthGuard>
          }
        />
        <Route path="/forgot-password" element={<ResetPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/contact" element={<ContactUs />} />

        {/* Protected Routes - All use DashboardLayout */}
        {PROTECTED_BASE_PATHS.map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedDashboard
                user={user ?? undefined}
                onLogout={handleLogout}
              />
            }
          />
        ))}

        {/* Optionally redirect old paths */}
        {/* <Route path="/app/*" element={<Navigate to="/dashboard" replace />} /> */}

        {/* 404 catch-all (send to Home or a dedicated NotFound page) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
