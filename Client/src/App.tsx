import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage.tsx";
import { User } from "./types/index.ts";
import Dashboard from "./components/Dashboard.tsx";
import VerificationPage from "./pages/VerificationPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    window.addEventListener('storage', handleAuthChange);
    
    // Listen for custom auth events from same tab
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authChange', handleAuthChange);
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
    window.dispatchEvent(new Event('authChange'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="shimmer w-32 h-8 rounded-lg"></div>
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <div className="min-h-screen bg-off-white">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/signup"
            element={<SignupPage />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verification" element={<VerificationPage/>} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

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
    </BrowserRouter>
  );
}

export default App;