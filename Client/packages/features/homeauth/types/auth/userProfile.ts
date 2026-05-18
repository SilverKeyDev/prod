// User profile type (app-level)
import type { AuthMethod, UserRole } from "packages/features/homeauth/types/roles";

export type UserProfile = {
  id: string;
  cognito_id?: string | null;
  google_id?: string | null;
  email: string;
  name: string | null; // Made nullable for Google OAuth users who may not have a name
  phone?: string | null; // Explicitly nullable
  created_at: string | null;
  updated_at?: string | null;
  is_active: boolean;
  mls_id?: string | null;
  brokerage?: string | null;
  preferences_version?: string | null;
  has_subscription: boolean;
  subscription: unknown;
  has_preferences: boolean;
  is_agent: boolean;
  is_closing_mode?: boolean;
  agent_id?: string;
  client_ids?: string;
  roles?: UserRole[];
  auth_method?: AuthMethod; // NEW: Track authentication method
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  /** Brokerage org ids the user may administer (server-driven; optional until roster APIs ship). */
  brokerage_org_ids?: string[] | null;
};
