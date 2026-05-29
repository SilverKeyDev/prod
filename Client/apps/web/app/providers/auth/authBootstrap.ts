/**
 * Web-specific auth bootstrap wrapper.
 * Uses shared bootstrap logic from packages/hooks/data/auth with web-specific storage.
 * Handles web-only concerns like sessionStorage and bootstrap key tracking.
 */

import type { AuthBootstrapSetters } from "packages/features/homeauth/hooks/data/authBootstrap";
import { runAuthBootstrap as runSharedAuthBootstrap } from "packages/features/homeauth/hooks/data/authBootstrap";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

/**
 * Web-specific auth bootstrap that uses shared core logic.
 * Wraps the platform-agnostic bootstrap with web storage operations.
 */
export async function runAuthBootstrap(
  currentPath: string,
  setters: AuthBootstrapSetters
): Promise<void> {
  // Use platform storage abstraction (which will resolve to sessionStorage on web)
  const storage = getSessionStorage();

  // Delegate to shared bootstrap logic
  await runSharedAuthBootstrap(currentPath, setters, storage);
}

// Re-export types for convenience
export type { AuthBootstrapSetters } from "packages/hooks/data/auth/authBootstrap";
