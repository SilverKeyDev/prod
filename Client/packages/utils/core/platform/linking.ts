/**
 * Web: no-op. Linking is only used on native for OAuth redirects.
 */
export const Linking: { openURL?: (url: string) => Promise<void> } | undefined = undefined;
