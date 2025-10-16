// User-related type definitions

export type UserRole = "admin" | "agent" | "client" | "viewer" | "manager";

export type AuthMethod = "cognito" | "google" | "both" | "unknown";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;  // Made nullable for Google OAuth users who may not have a name
  phone?: string | null;  // Explicitly nullable
  created_at: string | null;
  is_active: boolean;
  has_subscription: boolean;
  subscription: unknown;
  has_preferences: boolean;
  is_agent: boolean;
  agent_id?: string;
  client_ids?: string;
  roles?: UserRole[];
  auth_method?: AuthMethod;  // NEW: Track authentication method
};

export type UserPreferences = {
  demographics?: unknown;
  financial_profile?: unknown;
  housing_preferences?: unknown;
  location_preferences?: unknown;
  lifestyle_preferences?: unknown;
  behavioral_patterns?: unknown;
  real_estate?: unknown;
  agent_preferences?: unknown;
  values?: unknown;
  emotional_signals?: unknown;
  report_section_priorities?: unknown;
  [key: string]: unknown;
};

export type Agent = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  license_number?: string;
  brokerage?: string;
  specialties?: string[];
  rating?: number;
  reviews_count?: number;
  profile_image?: string;
  bio?: string;
  years_experience?: number;
  client_ids?: string[];
};

export type Activity = {
  id: string;
  user_id: string;
  action: string;
  description: string;
  entity_type: string; // 'report', 'offer', 'document', etc.
  entity_id: string;
  metadata?: unknown;
  created_at: Date;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "report" | "offer" | "document" | "system" | "agent";
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  created_at: Date;
  expires_at?: Date;
};
