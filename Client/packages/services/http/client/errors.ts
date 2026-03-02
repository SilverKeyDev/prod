export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
    public bodyPreview: string,
    public parsedBody?: unknown
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
  }
}

export class AuthenticationError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public status: number
  ) {
    super(`Authentication error: ${errorCode} - ${message}`);
    this.name = "AuthenticationError";
  }
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = "TimeoutError";
  }
}
