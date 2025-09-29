/**
 * Guard components exports
 */

export { AuthGuard } from "./AuthGuard";
export { withAuthGuard } from "./withAuthGuard";
export { RoleGuard } from "./RoleGuard";
export { withRoleGuard } from "./withRoleGuard";
export { useRoleCheck } from "./useRoleCheck";
export { ProtectedRoute } from "../routes/ProtectedRoute";
export { default as FeatureFlagGuard } from "./FeatureFlagGuard";
// export { withFeatureFlag } from './withFeatureFlag'; // Removed due to missing module
export { useFeatureFlag, useFeatureFlags } from "./useFeatureFlag";
export { toggleFeatureFlag } from "./featureFlagUtils";
export type { UserRole } from "./RoleGuard";
