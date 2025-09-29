/**
 * Logout Hook Layer
 * Provides reactive mutation around the auth service
 * Handles React-specific concerns like navigation and state management
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../../services/auth";
import { asError } from "../../utils/error";

export type UseLogoutReturn = {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook that wraps authService.logout() with React-specific functionality
 * Provides UI state and handles navigation after logout
 */
export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the service layer for business logic
      const result = authService.logout();

      if (result.success) {
        // Note: Removed authChange and storage events to prevent conflicts
        // Auth state changes are now handled reactively through hook state

        // Navigate to login page
        navigate("/login");
      } else {
        setError(result.error ?? "Logout failed");
      }
    } catch (err: unknown) {
      const error = asError(err);
      const errorMessage = error.message;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return {
    logout,
    isLoading,
    error,
  };
}
