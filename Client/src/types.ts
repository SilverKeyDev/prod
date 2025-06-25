export interface User {
  // Basic Info
  userId: string;              // Unique identifier
  name: string;                // Full name
  email: string;               // Email address
  phone?: string;              // Optional phone number
  profilePicture?: string;     // URL or path to profile image

  // Business Info
  agencyName?: string;         // Real estate agency name
  licenseNumber?: string;      // Optional real estate license number
  role?: 'agent' | 'admin' | 'broker' | 'assistant';  // Role in agency

  // Preferences
  preferredLanguage?: string;
  timezone?: string;
  notificationPreferences?: {
    emailReports: boolean;
    emailMarketing: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };

  // Security
  passwordHash?: string;       // Stored on backend only
  lastLogin?: string;          // ISO timestamp
  isVerified?: boolean;        // Email/phone verification status

  // API Access
  apiToken?: string;
  apiTokenLastUpdated?: string;

  // Subscription
  subscriptionStatus?: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled';
  subscriptionPlan?: 'basic' | 'premium' | 'enterprise';
  subscriptionRenewalDate?: string;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}
