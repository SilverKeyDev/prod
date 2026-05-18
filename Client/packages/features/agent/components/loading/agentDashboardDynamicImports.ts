/**
 * Shared Promise per agent dashboard lazy chunk so prefetch + React.lazy()
 * reuse the same import().
 */
let clientListModulePromise: Promise<typeof import("../clientList/ClientList")> | null = null;
let clientHubModulePromise: Promise<typeof import("../clientHub/ClientHubScreen")> | null = null;

export function loadClientListModule(): Promise<typeof import("../clientList/ClientList")> {
  clientListModulePromise ??= import("../clientList/ClientList");
  return clientListModulePromise;
}

export function loadClientHubModule(): Promise<typeof import("../clientHub/ClientHubScreen")> {
  clientHubModulePromise ??= import("../clientHub/ClientHubScreen");
  return clientHubModulePromise;
}
