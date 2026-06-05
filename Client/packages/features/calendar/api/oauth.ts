import { apiGet, apiPost } from "packages/services/http";
import type { components } from "packages/types/api.generated";
import { getDocument, getWindow } from "packages/utils/core/platform";

export type RevokeResponse = components["schemas"]["RevokeResponse"];
export type ConnectionStatusResponse = components["schemas"]["ConnectionStatusResponse"];

export async function startOAuth(useSchedulingScopes: boolean = false): Promise<void> {
  const win = getWindow();
  if (!win) return;
  const url = useSchedulingScopes
    ? "/api/v1/google/oauth/start?scheduling=true"
    : "/api/v1/google/oauth/start";
  win.location.href = url;
}

export async function revokeAccess(): Promise<RevokeResponse> {
  try {
    return await apiPost<RevokeResponse>("/api/v1/google/oauth/revoke", {});
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
    const response = await apiGet<ConnectionStatusResponse>("/api/v1/google/connection-status");
    return response.success === true && response.connected === true;
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
