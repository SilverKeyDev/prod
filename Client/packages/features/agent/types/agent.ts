/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * API types are now generated from openapi.yaml via api.generated.ts.
 * This file contains UI-level types that augment the API schema.
 *
 * For API contract types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types auto-generated in packages/types/api.generated.ts
 */

import type { TodoItem as ApiTodoItem } from "packages/features/agent/api/agent";

// Agent type (app-level UI type - extends API agent data)
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

// Todo types (re-exported from API for feature consumers)
export type TodoItem = ApiTodoItem;
export type TodoType = ApiTodoItem["type"];
