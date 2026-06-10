export type ErrorContext = {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  sessionId?: string;
  buildVersion?: string;
  environment?: string;
  type?: string;
  componentStack?: string;
  errorBoundary?: boolean;
  routeError?: boolean;
  userFeedback?: boolean;
  feedbackMessage?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
};

export type SecurityEvent = {
  type:
    | "authentication_failure"
    | "authorization_failure"
    | "suspicious_activity"
    | "data_access"
    | "session_anomaly";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, unknown>;
};
