import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  UserProfile,
  UserPreferences,
  ApiResponse,
  ApiError,
} from "./utils";
import {
  fetchJson,
  logHttp,
  createAuthHeaders,
  getAuthToken,
  routeStartsWith,
  isAuthenticationError,
  handleAuthenticationError,
} from "../lib/fetchUtils";
import { useAuth } from "./AuthContext";

/* =========================
   Types
   ========================= */

interface UserContextType {
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  userProfileError: string | null;
  refreshUserProfile: () => Promise<void>;

  userPreferences: UserPreferences | null;
  preferencesLoading: boolean;
  preferencesError: string | null;
  refreshUserPreferences: () => Promise<void>;
}

/* =========================
   Context
   ========================= */

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, authReady } = useAuth();
  
  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [userProfileError, setUserProfileError] = useState<string | null>(null);

  // Preferences state
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  /* =========================
     Fetchers
     ========================= */

  const fetchUserProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setUserProfileLoading(true);
    setUserProfileError(null);

    try {
      const response = await fetchJson<ApiResponse<UserProfile>>(
        "/api/v1/user/profile",
        {
          headers: createAuthHeaders(token),
          acceptStatuses: [404] // Treat 404 as no profile
        }
      );
      
      if (response?.success && response.data) {
        setUserProfile(response.data);
      } else if (response === undefined) {
        // 404 response, treat as no profile
        setUserProfile(null);
      } else {
        throw new Error(
          (response as ApiError).error || "Failed to fetch user profile"
        );
      }
    } catch (e: any) {
      logHttp('user-profile', e);
      setUserProfileError(e?.message ?? "Failed to fetch user profile");
      setUserProfile(null); // Safe fallback
    } finally {
      setUserProfileLoading(false);
    }
  }, []);

  const fetchUserPreferences = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setPreferencesLoading(true);
    setPreferencesError(null);

    try {
      const response = await fetchJson<any>(
        "/api/v1/preferences",
        {
          method: "GET",
          headers: createAuthHeaders(token),
          acceptStatuses: [404] // Treat 404 as no preferences
        }
      );
      
      if (response?.preferences) {
        setUserPreferences(response.preferences);
      } else if (response === undefined) {
        // 404 response, treat as no preferences
        setUserPreferences(null);
      } else {
        throw new Error("Failed to fetch user preferences");
      }
    } catch (error) {
      if (isAuthenticationError(error)) {
        handleAuthenticationError(error as any);
        return; // User will be redirected
      }
      logHttp('user-preferences', error);
      setPreferencesError((error as any)?.message ?? "Failed to fetch user preferences");
      setUserPreferences(null); // Safe fallback
    } finally {
      setPreferencesLoading(false);
    }
  }, []);

  /* =========================
     Public refresh functions
     ========================= */

  const refreshUserProfile = useCallback(
    () => fetchUserProfile(),
    [fetchUserProfile]
  );
  const refreshUserPreferences = useCallback(
    () => fetchUserPreferences(),
    [fetchUserPreferences]
  );

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness and relevant routes
  useEffect(() => {
    const profileEnabled = authReady && !!user?.id && (
      routeStartsWith('/') ||
      routeStartsWith('/profile') ||
      routeStartsWith('/personalization')
    );
    
    const preferencesEnabled = authReady && !!user?.id && (
      routeStartsWith('/') ||
      routeStartsWith('/personalization') ||
      routeStartsWith('/onboarding') ||
      routeStartsWith('/generate') // Report generation needs preferences
    );
    
    if (profileEnabled) {
      refreshUserProfile();
    }
    
    if (preferencesEnabled) {
      refreshUserPreferences();
    }
  }, [authReady, user?.id, refreshUserProfile, refreshUserPreferences]);

  // Cross-tab auth changes - only refresh if on relevant routes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          // Only refresh if on relevant routes
          const profileEnabled = routeStartsWith('/') ||
                                 routeStartsWith('/profile') ||
                                 routeStartsWith('/personalization');
          const preferencesEnabled = routeStartsWith('/') ||
                                     routeStartsWith('/personalization') ||
                                     routeStartsWith('/onboarding') ||
                                     routeStartsWith('/generate');
          
          if (profileEnabled) refreshUserProfile();
          if (preferencesEnabled) refreshUserPreferences();
        } else {
          // Clear everything
          setUserProfile(null);
          setUserPreferences(null);
          setUserProfileError(null);
          setPreferencesError(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshUserProfile, refreshUserPreferences]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<UserContextType>(
    () => ({
      userProfile,
      userProfileLoading,
      userProfileError,
      refreshUserProfile,

      userPreferences,
      preferencesLoading,
      preferencesError,
      refreshUserPreferences,
    }),
    [
      userProfile,
      userProfileLoading,
      userProfileError,
      refreshUserProfile,
      userPreferences,
      preferencesLoading,
      preferencesError,
      refreshUserPreferences,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/* =========================
   Hooks
   ========================= */

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return {
    userProfile: ctx.userProfile,
    loading: ctx.userProfileLoading,
    error: ctx.userProfileError,
    refreshUserProfile: ctx.refreshUserProfile,
  };
}

export function usePreferences() {
  const ctx = useContext(UserContext);
  if (!ctx)
    throw new Error("usePreferences must be used within a UserProvider");
  return {
    userPreferences: ctx.userPreferences,
    loading: ctx.preferencesLoading,
    error: ctx.preferencesError,
    refreshUserPreferences: ctx.refreshUserPreferences,
  };
}
