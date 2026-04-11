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
 * This shim maintains backward compatibility for existing imports.
 */

import { loginHandler } from "./handlers/login";
import { refreshTokenHandler, verifySessionHandler } from "./handlers/session";
import {
  forgotPasswordHandler,
  logoutHandler,
  resendCodeHandler,
  resetPasswordHandler,
  signupHandler,
} from "./handlers/simple";
import { verifyHandler } from "./handlers/verify";

export type { AuthResponse, LoginData, SignupData } from "./types";

/**
 * Authentication API client using centralized utilities
 */
export const authApi = {
  signup: signupHandler,
  resendCode: resendCodeHandler,
  verify: verifyHandler,
  login: loginHandler,
  forgotPassword: forgotPasswordHandler,
  resetPassword: resetPasswordHandler,
  logout: logoutHandler,
  verifySession: verifySessionHandler,
  refreshToken: refreshTokenHandler,
};
