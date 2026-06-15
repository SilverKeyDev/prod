import { notifyAuthenticationError } from "./client/auth/authErrorNotify";
import { AuthenticationError } from "./client/errors";

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}

export function handleAuthenticationError(error: AuthenticationError): void {
  notifyAuthenticationError(error);
}
