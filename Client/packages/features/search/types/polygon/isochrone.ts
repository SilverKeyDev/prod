/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * Isochrone API + UI/legacy shape unified.
 */

import type { components } from "packages/types/api.generated";

// Re-export from generated schema
export type IsochroneData = components["schemas"]["IsochroneData"];
export type IsochroneApiResponse = components["schemas"]["IsochroneResponse"];
