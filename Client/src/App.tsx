import { useState, useEffect } from "react";
import MaintenanceScreen from "./pages/HomeAuth/MaintenanceScreen";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/HomeAuth/LoginPage";
import SignupPage from "./pages/HomeAuth/SignupPage";
import ResetPasswordPage from "./pages/HomeAuth/ResetPasswordPage";
import HomePage from "./pages/HomeAuth/HomePage.tsx";
import Dashboard from "./components/layout/Dashboard.tsx";
import VerificationPage from "./pages/HomeAuth/VerificationPage";
import OnboardingPage from "./pages/HomeAuth/OnboardingPage";
import PrivacyPolicy from "./pages/HomeAuth/PrivacyPolicy.tsx";
import TermsOfService from "./pages/HomeAuth/TermsOfService.tsx";
import ContactUs from "./pages/HomeAuth/ContactUs.tsx";
import { AppProviders, UserProfile } from "./context";

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  // Health check
  useEffect(() => {
    let isMounted = true;
    fetch("/healthz", { method: "GET" })
      .then((res) => {
        if (!res.ok) {
          console.error("/healthz responded with status:", res.status);
          throw new Error("Healthz failed with status: " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log("/healthz response:", data);
        if (isMounted) {
          if (data && data.status === "ok") {
            setMaintenance(false);
          } else {
            setMaintenance(true);
            console.warn("/healthz returned unexpected data:", data);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setMaintenance(true);
          console.error("Error fetching /healthz:", err);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);

    // Listen for auth changes (login/logout)
    const handleAuthChange = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    };

    // Listen for storage changes from other tabs
    window.addEventListener("storage", handleAuthChange);

    // Listen for custom auth events from same tab
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    // Clear all authentication-related localStorage items
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    localStorage.removeItem("signupEmail"); // Also clear any leftover signup email

    // Dispatch auth change event
    window.dispatchEvent(new Event("authChange"));
  };

  return (
    <AppProviders>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        {loading ? (
          <div className="min-h-screen bg-off-white flex items-center justify-center">
            <div className="shimmer w-32 h-8 rounded-lg"></div>
          </div>
        ) : maintenance ? (
          <MaintenanceScreen />
        ) : (
          <div className="min-h-screen bg-off-white">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ResetPasswordPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/contact" element={<ContactUs />} />

              {/* Protected Route */}
              <Route
                path="/dashboard/*"
                element={
                  user ? (
                    <Dashboard user={user} onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
            </Routes>
          </div>
        )}
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
