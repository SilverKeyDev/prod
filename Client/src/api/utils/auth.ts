/* =========================
   Auth Utilities
   ========================= */

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // Try to get from secure hook first (memory-based access token)
    if ((window as unknown as Record<string, unknown>).getSecureAccessToken) {
      const token = (
        window as unknown as Record<string, unknown>
      ).getSecureAccessToken() as string;
      if (token && isValidJWTFormat(token)) {
        return token;
      }
    }

    // Fallback to sessionStorage access token only
    const accessToken = sessionStorage.getItem("access_token");
    if (accessToken && isValidJWTFormat(accessToken)) {
      return accessToken;
    }

    // Last resort: check localStorage for id_token (but validate format)
    const idToken = localStorage.getItem("id_token");
    if (idToken && isValidJWTFormat(idToken)) {
      return idToken;
    }

    return null;
  } catch {
    return null;
  }
}

// Helper function to validate JWT format (3 parts separated by dots)
function isValidJWTFormat(token: string): boolean {
  return typeof token === "string" && token.split(".").length === 3;
}

export function createAuthHeaders(token?: string | null): HeadersInit {
  const authToken = token ?? getAuthToken();
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (authToken) base.Authorization = `Bearer ${authToken}`;

  // Hook point for CSRF tokens if you use cookies:
  // const csrf = document.cookie?.match(/csrftoken=([^;]+)/)?.[1];
  // if (csrf) base['X-CSRF-Token'] = csrf;

  return base;
}

/* =========================
   Route Utilities
   ========================= */

export const routeStartsWith = (prefix: string): boolean => {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith(prefix);
};

export const routeMatchesAny = (prefixes: string[]): boolean => {
  return prefixes.some((p) => routeStartsWith(p));
};
