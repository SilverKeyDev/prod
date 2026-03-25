export type LoginResult = {
  success: boolean;
  needsVerification?: boolean;
};

export type ApplyLoginResultOptions = {
  email: string;
  password: string;
  /** Called when login succeeded (e.g. web: navigateToPath(safe); native: no-op). */
  onSuccess?: () => void;
  /** Called when needsVerification; session is already updated with signupEmail/signupPassword. */
  onNeedsVerification: () => void;
};
