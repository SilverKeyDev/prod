// User-related type definitions

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: string | null;
  is_active: boolean;
  has_subscription: boolean;
  subscription: any;
  has_preferences: boolean;
  is_agent: boolean;
  agent_id?: string;
  client_ids?: string;
}

export interface UserPreferences {
  demographics?: any;
  financial_profile?: any;
  housing_preferences?: any;
  location_preferences?: any;
  lifestyle_preferences?: any;
  behavioral_patterns?: any;
  real_estate?: any;
  agent_preferences?: any;
  values?: any;
  emotional_signals?: any;
  report_section_priorities?: any;
  [key: string]: any;
}

export interface Agent {
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
}

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  description: string;
  entity_type: string; // 'report', 'offer', 'document', etc.
  entity_id: string;
  metadata?: any;
  created_at: Date;
}

export interface Notification {
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
}
