/**
 * Google Calendar OAuth and connection status.
 * Web-only: uses platform window/document for redirects and cookie checks; no-op when adapter not set (e.g. RN).
 */

import { apiGet, apiPost } from "packages/services/http/compatibility";
import { getDocument, getWindow } from "packages/utils/platform";

import type { GoogleCalendarApiResponse } from "./types";

export async function startOAuth(useSchedulingScopes: boolean = false): Promise<void> {
  const win = getWindow();
  if (!win) return;
  const url = useSchedulingScopes
    ? "/api/v1/google/oauth/start?scheduling=true"
    : "/api/v1/google/oauth/start";
  win.location.href = url;
}

export async function revokeAccess(): Promise<GoogleCalendarApiResponse<{ ok: boolean }>> {
  try {
    return await apiPost<GoogleCalendarApiResponse<{ ok: boolean }>>(
      "/api/v1/google/oauth/revoke",
      {}
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke access",
    };
  }
}

export async function startOAuthWithFullScope(): Promise<void> {
  const win = getWindow();
  if (win) win.location.href = "/api/v1/google/oauth/start?full_scope=true";
}

export async function isConnected(): Promise<boolean> {
  try {
    const response = await apiGet<GoogleCalendarApiResponse<{ isConnected: boolean }>>(
      "/api/v1/google/connection-status"
    );
    return response.success && response.data?.isConnected === true;
  } catch {
    const doc = getDocument();
    return doc?.cookie?.includes("google_calendar_connected=true") ?? false;
  }
}

export function clearConnectionStatus(): void {
  const doc = getDocument();
  if (doc) {
    doc.cookie = "google_calendar_connected=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  }
}
