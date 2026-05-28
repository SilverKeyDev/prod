import { usePostHogIdentity } from "packages/hooks/store/usePostHogIdentity.web";

export function PostHogIdentitySync() {
  usePostHogIdentity();
  return null;
}
