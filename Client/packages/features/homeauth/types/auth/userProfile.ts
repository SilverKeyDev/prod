// User profile type (app-level)
import type { AuthMethod } from "./roles";
import type { UserRole } from "./roles";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null; // Made nullable for Google OAuth users who may not have a name
  phone?: string | null; // Explicitly nullable
  created_at: string | null;
  is_active: boolean;
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
};
