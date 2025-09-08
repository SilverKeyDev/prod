import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import MaintenanceScreen from "../pages/HomeAuth/MaintenanceScreen";
import { AppProviders } from "./providers/AppProviders";
import { UserProfile } from "../context";
import { AppWithRouter } from "./AppWithRouter";
import {
  initializeErrorReporting,
  setUserContext,
  clearUserContext,
} from "../lib/security/errorReporting";
import { log } from "../lib/security/secureLogger";

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false); // Only show maintenance if health check fails

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
        if (isMounted) {
          if (data && data.status === "ok") {
            setMaintenance(false);
          } else {
            setMaintenance(true);
            console.warn("/healthz returned unexpected data:");
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
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize error reporting on app start
  useEffect(() => {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn) {
      initializeErrorReporting({
        dsn: sentryDsn,
      });
    }
    // Sentry infrastructure ready but not actively warning when DSN not configured
  }, []);

  useEffect(() => {
    log.debug('APP', 'Checking for saved user in localStorage');
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      log.info('APP', 'Found saved user data in localStorage');
      const parsedUser = JSON.parse(savedUser);
      log.info('APP', 'User authenticated successfully');
      setUser(parsedUser);
      // Set user context for error reporting (secure logger will automatically scrub PII)
      setUserContext(parsedUser.id || parsedUser.user_sub, {
        email: parsedUser.email,
        role: parsedUser.role,
      });
    } else {
      log.debug('APP', 'No saved user found in localStorage');
    }
    // Don't set loading to false here - wait for AuthProvider to be ready

    // Listen for auth changes (login/logout)
    const handleAuthChange = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        log.info("APP", "Auth change: User found, updating state");
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setUserContext(parsedUser.id || parsedUser.user_sub, {
          email: parsedUser.email,
          role: parsedUser.role,
        });
      } else {
        log.info("APP", "Auth change: No user found, clearing state");
        setUser(null);
        clearUserContext();
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
    console.log("[APP] 🚪 Logout initiated");
    
    // Call secure auth logout if available
    if ((window as any).secureLogout) {
      console.log("[APP] 🔒 Calling secure auth logout");
      (window as any).secureLogout();
    } else {
      // Fallback: clear tokens manually
      console.log("[APP] 🧹 Secure auth not available, clearing tokens manually");
      setUser(null);
      clearUserContext();

      // Clear all authentication-related storage
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("id_token");
      localStorage.removeItem("signupEmail");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");

      // Clear secure auth tokens
      if ((window as any).clearSecureTokens) {
        (window as any).clearSecureTokens();
      }

      // Dispatch auth change event
      window.dispatchEvent(new Event("authChange"));
      console.log("[APP] 📢 Dispatched authChange event");
    }
  };

  return (
    <AppProviders>
      <BrowserRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        {loading ? (
          <div className="min-h-screen bg-off-white flex items-center justify-center">
            <div className="shimmer w-32 h-8 rounded-lg"></div>
          </div>
        ) : maintenance ? (
          <MaintenanceScreen />
        ) : (
          <AppWithRouter user={user} handleLogout={handleLogout} setLoading={setLoading} />
        )}
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
