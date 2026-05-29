/**
 * Features barrel file - centralized exports for all feature modules
 * Each feature module manages its own internal exports through its index.ts
 */

// Agent feature - client management, agent dashboard
export * from "./agent";

// Calendar feature - scheduling, events, Google Calendar integration
export * from "./calendar";

// Checklists feature - home buying checklists and tasks
export * from "./checklists";

// Compare feature - property comparison tools
export * from "./compare";

// Dashboard feature - main dashboard screens
export * from "./dashboard";

// Documents feature - document management
export * from "./documents";

// Feed feature - property feed, reels, media carousel
export * from "./feed";

// Home auth feature - authentication, onboarding, user management
export * from "./homeauth";

// Messaging feature - client-agent messaging
export * from "./messaging";

// Negotiate feature - offer negotiation tools
export * from "./negotiate";

// Profile feature - user profiles and preferences
export * from "./profile";

// Property details feature - property detail modals and screens
export * from "./propertyDetails";

// Saved feature - saved homes management
export * from "./saved";

// Search feature - property search, filters, maps
export * from "./search";
