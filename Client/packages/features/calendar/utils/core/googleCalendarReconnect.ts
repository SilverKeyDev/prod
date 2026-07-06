export const GOOGLE_RECONNECT_REQUIRED = "GOOGLE_RECONNECT_REQUIRED";

const DEFAULT_RECONNECT_MESSAGE =
  "Google Calendar reconnection required. Please reconnect your Google Calendar account.";

export class GoogleReconnectRequiredError extends Error {
  readonly code = GOOGLE_RECONNECT_REQUIRED;

  constructor(message: string = DEFAULT_RECONNECT_MESSAGE) {
    super(message);
    this.name = "GoogleReconnectRequiredError";
  }
}

export function isGoogleReconnectRequiredApiError(error: string | undefined): boolean {
  return error === GOOGLE_RECONNECT_REQUIRED;
}

export function isGoogleReconnectRequiredError(
  error: unknown
): error is GoogleReconnectRequiredError {
  return error instanceof GoogleReconnectRequiredError;
}
