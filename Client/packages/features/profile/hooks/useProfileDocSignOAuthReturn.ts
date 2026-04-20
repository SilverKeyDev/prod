import { useEffect } from "react";

import { showErrorToast, showSuccessToast } from "packages/hooks/ui/toast/useToast";

export type ProfileDocSignNavigation = {
  getCurrentRoute: () => { pathname: string };
  getSearchParams: () => { get: (key: string) => string | null };
  navigateToPath: (path: string, options?: { replace?: boolean }) => void;
};

/** Handles return from DocuSign OAuth on `/profile/docusign` and navigates back to profile. */
export function useProfileDocSignOAuthReturn(navigation: ProfileDocSignNavigation): void {
  useEffect(() => {
    const { pathname } = navigation.getCurrentRoute();
    if (!pathname.startsWith("/profile/docusign")) return;

    const searchParams = navigation.getSearchParams();
    const connected = searchParams.get("connected") === "true";
    const hasError = searchParams.get("error") === "true";

    if (!connected && !hasError) return;

    if (connected) {
      showSuccessToast("DocuSign connected successfully.");
    } else if (hasError) {
      showErrorToast("DocuSign connection failed. Please try again.");
    }

    navigation.navigateToPath("/profile", { replace: true });
  }, [navigation]);
}
