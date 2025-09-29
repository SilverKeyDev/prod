import { useEffect, useRef } from "react";
import { useUserStore } from "../../store/user.slice";
import { useUserData } from "../data/useUserData";

/**
 * Hook that integrates useUserData with useUserStore
 * This replaces the UserProvider functionality
 */
export function useUserStoreIntegration() {
  const {
    userProfile: dataUserProfile,
    userProfileLoading: dataUserProfileLoading,
    userProfileError: dataUserProfileError,
    refreshUserProfile: dataRefreshUserProfile,
  } = useUserData();

  const {
    userProfile,
    userPreferences,
    userLoading,
    userError,
    setUserProfile,
    setUserPreferences,
    setUserLoading,
    setUserError,
  } = useUserStore();

  // Sync data hook with store (guard against redundant updates)
  const lastDataUserProfileRef = useRef<typeof dataUserProfile>();
  const lastDataUserProfileLoadingRef = useRef<typeof dataUserProfileLoading>();
  const lastDataUserProfileErrorRef = useRef<typeof dataUserProfileError>();

  useEffect(() => {
    if (lastDataUserProfileRef.current !== dataUserProfile) {
      lastDataUserProfileRef.current = dataUserProfile;
      setUserProfile(dataUserProfile);
    }
  }, [dataUserProfile, setUserProfile]);

  useEffect(() => {
    if (lastDataUserProfileLoadingRef.current !== dataUserProfileLoading) {
      lastDataUserProfileLoadingRef.current = dataUserProfileLoading;
      setUserLoading(dataUserProfileLoading);
    }
  }, [dataUserProfileLoading, setUserLoading]);

  useEffect(() => {
    if (lastDataUserProfileErrorRef.current !== dataUserProfileError) {
      lastDataUserProfileErrorRef.current = dataUserProfileError;
      setUserError(dataUserProfileError);
    }
  }, [dataUserProfileError, setUserError]);

  // Expose the combined state and actions
  return {
    // State from store (synced with data hook)
    userProfile,
    userPreferences,
    userLoading,
    userError,

    // Actions
    setUserProfile,
    setUserPreferences,
    setUserLoading,
    setUserError,
    refreshUserProfile: dataRefreshUserProfile,
  };
}
