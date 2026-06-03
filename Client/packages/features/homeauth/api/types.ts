import type { components } from "packages/types/api.generated";

// Re-export types from generated schema
export type SignupData = components["schemas"]["SignupData"];
export type LoginData = components["schemas"]["LoginData"];
export type AuthResponse = components["schemas"]["AuthResponse"];
