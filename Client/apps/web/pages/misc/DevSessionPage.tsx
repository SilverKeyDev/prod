import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { adminApi } from "packages/features/admin/api/admin";
import {
  mapAuthResponseToUserProfile,
  toUserStoreProfile,
} from "packages/features/homeauth/hooks/data/utils/userMapping";
import { log, LOG_CATEGORIES } from "packages/logger";
import { ROUTES } from "packages/navigation/types/routes";
import { storeDevSessionAccessToken } from "packages/services/http/authToken";
import { useAuthStore, useUserStore } from "packages/store";
import { Box, Text } from "packages/ui/components/primitives";

export default function DevSessionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Opening dev session...");
  const setAuthUser = useAuthStore((s) => s.setUser);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const setUserProfile = useUserStore((s) => s.setUserProfile);

  useEffect(() => {
    const token = params.get("t");
    if (!token) {
      setMessage("Missing dev session token.");
      return;
    }

    let cancelled = false;

    async function exchange() {
      try {
        const response = await adminApi.exchangeDevAccountSession(token);
        if (!response.user || !response.access_token) {
          throw new Error("Dev session response was incomplete");
        }

        storeDevSessionAccessToken(response.access_token);
        const user = mapAuthResponseToUserProfile(response.user, response.user_sub ?? undefined);
        setAuthUser(user);
        setIsAuthenticated(true);
        setAuthStatus("authenticated");
        setAuthReady(true);
        setUserProfile(toUserStoreProfile(user));

        if (cancelled) return;
        log.security(LOG_CATEGORIES.AUTH, "Dev session opened in tab", {
          userId: user.id,
          role: user.roles?.join(","),
        });
        void navigate(ROUTES.SEARCH, { replace: true });
      } catch (error) {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "Failed to open dev session.");
      }
    }

    void exchange();

    return () => {
      cancelled = true;
    };
  }, [
    navigate,
    params,
    setAuthReady,
    setAuthStatus,
    setAuthUser,
    setIsAuthenticated,
    setUserProfile,
  ]);

  return (
    <Box className="flex min-h-screen items-center justify-center bg-background-base px-4">
      <Text className="text-sm text-text-secondary">{message}</Text>
    </Box>
  );
}
