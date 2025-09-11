// User-related type definitions

interface UserSubscription {
  plan?: string;
  status?: 'active' | 'inactive' | 'pending' | 'cancelled';
  created_at?: string;
  expires_at?: string;
  features?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: string | null;
  is_active: boolean;
  has_subscription: boolean;
  subscription: UserSubscription;
  has_preferences: boolean;
  is_agent: boolean;
  agent_id?: string;
  client_ids?: string;
}

interface Demographics {
  age?: number;
  age_range?: string;
  marital_status?: string;
  household_size?: number;
  occupation?: string;
  education_level?: string;
  income_range?: string;
}

interface FinancialProfile {
  annual_income?: number;
  credit_score?: number;
  debt_to_income?: number;
  down_payment_amount?: number;
  max_monthly_payment?: number;
  pre_approval_amount?: number;
  loan_type_preference?: string;
}

interface HousingPreferences {
  property_type?: string[];
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  min_sqft?: number;
  max_sqft?: number;
  preferred_features?: string[];
  must_have_features?: string[];
  deal_breakers?: string[];
}

interface LocationPreferences {
  preferred_cities?: string[];
  preferred_neighborhoods?: string[];
  max_commute_time?: number;
  important_locations?: Array<{
    name: string;
    address: string;
    commute_tolerance?: number;
  }>;
  school_district_importance?: 'high' | 'medium' | 'low';
  walkability_importance?: 'high' | 'medium' | 'low';
}

interface LifestylePreferences {
  lifestyle_type?: 'urban' | 'suburban' | 'rural';
  outdoor_activities?: string[];
  indoor_activities?: string[];
  social_preferences?: string[];
  pet_ownership?: boolean;
  children?: boolean;
}

interface BehavioralPatterns {
  search_frequency?: string;
  decision_making_style?: 'analytical' | 'intuitive' | 'collaborative';
  communication_preference?: 'email' | 'phone' | 'text' | 'in-person';
  viewing_preferences?: string[];
}

interface RealEstatePreferences {
  buying_timeline?: string;
  first_time_buyer?: boolean;
  investment_property?: boolean;
  move_in_ready?: boolean;
  renovation_willingness?: 'high' | 'medium' | 'low' | 'none';
  market_knowledge?: 'beginner' | 'intermediate' | 'advanced';
}

interface AgentPreferences {
  preferred_communication_style?: string;
  meeting_frequency?: string;
  experience_level_preference?: string;
  specialization_preferences?: string[];
  language_preferences?: string[];
}

interface UserValues {
  priorities?: string[];
  important_factors?: string[];
  lifestyle_values?: string[];
  financial_goals?: string[];
}

interface EmotionalSignals {
  stress_level?: 'low' | 'medium' | 'high';
  excitement_level?: 'low' | 'medium' | 'high';
  confidence_level?: 'low' | 'medium' | 'high';
  urgency_level?: 'low' | 'medium' | 'high';
}

export interface UserPreferences {
  demographics?: Demographics;
  financial_profile?: FinancialProfile;
  housing_preferences?: HousingPreferences;
  location_preferences?: LocationPreferences;
  lifestyle_preferences?: LifestylePreferences;
  behavioral_patterns?: BehavioralPatterns;
  real_estate?: RealEstatePreferences;
  agent_preferences?: AgentPreferences;
  values?: UserValues;
  emotional_signals?: EmotionalSignals;
  report_section_priorities?: string[];
  [key: string]: unknown;
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
  metadata?: Record<string, unknown>;
  created_at: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'report' | 'offer' | 'document' | 'system' | 'agent';
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  created_at: Date;
  expires_at?: Date;
}
