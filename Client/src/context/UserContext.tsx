import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { useOnceEffect } from "../hooks/useOnceEffect";
import { UserProfile, UserPreferences } from "./utils";
import {
  routeStartsWith,
  isAuthenticationError,
  handleAuthenticationError,
} from "../api/utils/index";
import { userApi, preferencesApi } from "../api";
import { useAuth } from "../app/providers";

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

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, authReady } = useAuth();

  // Debug auth state - log on every render to catch changes
  useEffect(() => {
    console.log("[USER_CONTEXT] 🔍 Auth context values changed:", {
      user,
      authReady,
      userType: typeof user,
      hasUserId: !!user?.id,
      userKeys: user ? Object.keys(user) : null,
    });
  }, [user, authReady]);

  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [userProfileError, setUserProfileError] = useState<string | null>(null);

  // Preferences state
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  // Centralized preferences loading to prevent duplicate API calls
  const preferencesPromiseRef = useRef<Promise<void> | null>(null);
  const preferencesCacheRef = useRef<{
    data: UserPreferences | null;
    timestamp: number;
  } | null>(null);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /* =========================
     Fetchers
     ========================= */

  const fetchUserProfile = useCallback(async () => {
    console.log("[USER_CONTEXT] 🚀 fetchUserProfile called");
    setUserProfileLoading(true);
    setUserProfileError(null);

    try {
      const response = await userApi.getProfile();
      console.log(
        "[USER_CONTEXT] GET /api/v1/user/profile response:",
        response,
      );

      // Handle both 'user' and 'data' response structures from backend
      const userData = response.user || response.data;
      console.log("[USER_CONTEXT] Extracted userData:", userData);

      if (response.success && userData) {
        // Convert User to UserProfile by adding missing properties
        const userProfile: UserProfile = {
          ...userData,
          has_subscription: userData.has_subscription || false,
          subscription: userData.subscription || null,
          has_preferences: userData.has_preferences || false,
          is_agent: userData.is_agent || false,
          created_at: userData.created_at || null,
          client_ids: Array.isArray(userData.client_ids)
            ? userData.client_ids.join(",")
            : userData.client_ids || "",
        };
        console.log("[USER_CONTEXT] Final userProfile object:", userProfile);
        console.log("[USER_CONTEXT] Name field:", userProfile.name);
        console.log("[USER_CONTEXT] Email field:", userProfile.email);
        setUserProfile(userProfile);
      } else {
        console.warn("Failed to get user profile:", response);
        setUserProfile(null);
      }
    } catch (e: unknown) {
      console.error("Failed to fetch user profile", e);
      setUserProfileError(e?.message ?? "Failed to fetch user profile");
      setUserProfile(null);
    } finally {
      setUserProfileLoading(false);
    }
  }, []);

  const fetchUserPreferences = useCallback(async () => {
    const DEV = import.meta.env.MODE !== "production";

    // Check cache first
    const now = Date.now();
    const cached = preferencesCacheRef.current;
    if (cached && now - cached.timestamp < CACHE_TTL) {
      if (DEV) console.count("[USER_CONTEXT] Using cached preferences");
      setUserPreferences(cached.data);
      return;
    }

    // Return existing promise if already loading
    if (preferencesPromiseRef.current) {
      if (DEV) {
        console.count(
          "[USER_CONTEXT] Waiting for existing preferences request",
        );
      }
      return preferencesPromiseRef.current;
    }

    // Create new load promise
    if (DEV) console.count("[USER_CONTEXT] Starting new preferences request");
    setPreferencesLoading(true);
    setPreferencesError(null);

    const loadPromise = (async () => {
      try {
        const response = await preferencesApi.get();
        const preferences = response.preferences || null;

        // Update cache
        preferencesCacheRef.current = { data: preferences, timestamp: now };
        setUserPreferences(preferences);
      } catch (error) {
        if (isAuthenticationError(error)) {
          handleAuthenticationError(error as any);
          return; // User will be redirected
        }
        console.error("Failed to fetch user preferences", error);
        setPreferencesError(
          (error as any)?.message ?? "Failed to fetch user preferences",
        );
        setUserPreferences(null);
      } finally {
        setPreferencesLoading(false);
        preferencesPromiseRef.current = null;
      }
    })();

    preferencesPromiseRef.current = loadPromise;
    return loadPromise;
  }, [CACHE_TTL]);

  /* =========================
     Public refresh functions
     ========================= */

  const refreshUserProfile = useCallback(
    () => fetchUserProfile(),
    [fetchUserProfile],
  );
  const refreshUserPreferences = useCallback(
    () => fetchUserPreferences(),
    [fetchUserPreferences],
  );

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness - load profile on all authenticated routes
  useOnceEffect(() => {
    const DEV = import.meta.env.MODE !== "production";

    console.log("[USER_CONTEXT] 🔍 Auth state check:", {
      authReady,
      user,
      userId: user?.id,
    });

    // Always load user profile when authenticated since sidebar needs email/name on all routes
    const profileEnabled = authReady && !!user?.id;

    // Load preferences on specific routes that need them
    const preferencesEnabled =
      authReady &&
      !!user?.id &&
      (routeStartsWith("/") ||
        routeStartsWith("/personalization") ||
        routeStartsWith("/onboarding") ||
        routeStartsWith("/generate") ||
        routeStartsWith("/dashboard")); // Report generation and dashboard need preferences

    console.log("[USER_CONTEXT] 📊 Profile enabled check:", {
      profileEnabled,
      authReady,
      hasUserId: !!user?.id,
    });

    if (profileEnabled) {
      if (DEV) console.count("[USER_CONTEXT] Loading user profile for sidebar");
      console.log("[USER_CONTEXT] 🚀 Calling refreshUserProfile()");
      refreshUserProfile();
    } else {
      console.log(
        "[USER_CONTEXT] ❌ Profile loading skipped - conditions not met",
      );
    }

    if (preferencesEnabled) {
      DEV && console.count("[USER_CONTEXT] Loading user preferences");
      refreshUserPreferences();
    }
  });

  // Cross-tab auth changes - refresh profile on all routes, preferences on specific routes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          // Always refresh user profile since sidebar needs it on all routes
          refreshUserProfile();

          // Only refresh preferences on specific routes that need them
          const preferencesEnabled =
            routeStartsWith("/") ||
            routeStartsWith("/personalization") ||
            routeStartsWith("/onboarding") ||
            routeStartsWith("/generate") ||
            routeStartsWith("/dashboard");

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
    ],
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
