import { usePostHogIdentity } from "packages/hooks/store/integrations/usePostHogIdentity";

/** Syncs auth identity to PostHog on native (no UI). */
export function PostHogIdentitySyncNative() {
  usePostHogIdentity();
  return null;
}
