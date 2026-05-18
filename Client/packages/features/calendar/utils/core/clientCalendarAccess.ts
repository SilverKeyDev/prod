export const CLIENT_CALENDAR_PERMISSION_ERROR = "client_permission_required";

export type ClientCalendarFailureBody = {
  error?: string;
  message?: string;
  client_has_connection?: boolean;
};

export class ClientCalendarAccessError extends Error {
  readonly code = CLIENT_CALENDAR_PERMISSION_ERROR;
  readonly clientHasConnection: boolean;

  constructor(message: string, clientHasConnection: boolean) {
    super(message);
    this.name = "ClientCalendarAccessError";
    this.clientHasConnection = clientHasConnection;
  }
}

const DEFAULT_NOT_CONNECTED_MESSAGE =
  "This client has not connected their Google Calendar yet. Ask them to connect Google Calendar in their account settings so you can view their schedule.";

const DEFAULT_PERMISSION_MESSAGE =
  "This client connected Google Calendar but has not granted full calendar access. Ask them to reconnect and approve all requested permissions.";

export function isClientCalendarAccessError(error: unknown): error is ClientCalendarAccessError {
  return error instanceof ClientCalendarAccessError;
}

export function parseClientCalendarFailure(
  body: ClientCalendarFailureBody | null | undefined,
  fallbackMessage = "Could not load this client's calendar."
): Error {
  if (!body) {
    return new Error(fallbackMessage);
  }

  if (body.error === CLIENT_CALENDAR_PERMISSION_ERROR) {
    const clientHasConnection = Boolean(body.client_has_connection);
    const message =
      body.message?.trim() ||
      (clientHasConnection ? DEFAULT_PERMISSION_MESSAGE : DEFAULT_NOT_CONNECTED_MESSAGE);
    return new ClientCalendarAccessError(message, clientHasConnection);
  }

  const message = body.message?.trim() || body.error?.trim() || fallbackMessage;
  return new Error(message);
}
