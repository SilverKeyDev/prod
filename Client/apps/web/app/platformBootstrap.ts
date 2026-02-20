/**
 * Web app platform bootstrap. Runs before React so shared packages
 * (store, utils/storage, platform adapter) get real globals instead of in-memory fallbacks.
 */
import { setPlatformGlobals } from "packages/utils/core/platform";
import { setPlatformStorage } from "packages/utils/core/storage/platformStorage";

setPlatformStorage({
  persistStorage: localStorage,
  local: localStorage,
  session: sessionStorage,
});

setPlatformGlobals({
  window,
  document,
  navigator,
  Blob: typeof Blob !== "undefined" ? Blob : undefined,
  File: typeof File !== "undefined" ? File : undefined,
  fetch:
    typeof globalThis !== "undefined" && "fetch" in globalThis
      ? (globalThis as unknown as { fetch: typeof fetch }).fetch
      : undefined,
});
