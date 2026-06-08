import { getLocalStorage, getSessionStorage } from "packages/utils/storage/platformStorage";

export function clearLegacyAuthStorage(): void {
  try {
    const session = getSessionStorage();
    const local = getLocalStorage();
    session.removeItem("access_token");
    session.removeItem("dev_session_access_token");
    session.removeItem("refresh_token");
    session.removeItem("id_token");
    session.removeItem("user");
    local.removeItem("access_token");
    local.removeItem("token");
    local.removeItem("user");
  } catch {
    /* ignore */
  }
}
