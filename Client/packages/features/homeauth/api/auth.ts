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
