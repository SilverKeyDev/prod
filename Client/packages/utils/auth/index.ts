/** Cookie auth — tokens are not accessible to JavaScript. */

export const getAuthToken = (): string | null => null;

export const hasValidAuthToken = (): boolean => false;

/** No-op: session cookies are cleared via authApi.logout(). */
export const clearAuthTokens = (): void => {};
