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
 *
 * Minimal to-do shape for the upcoming agenda (dashboard maps agent todos here).
 * Keeps calendar feature free of agent package imports.
 */
export type AgendaTodoDTO = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
};
