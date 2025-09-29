/**
 * Development helper to toggle feature flags
 */
export function toggleFeatureFlag(flag: string): void {
  if (import.meta.env.DEV) {
    const devFlags = localStorage.getItem("dev-feature-flags");
    let flags: Record<string, boolean> = {};

    if (devFlags) {
      try {
        flags = JSON.parse(devFlags) as Record<string, boolean>;
      } catch {
        console.warn("Failed to parse dev feature flags");
      }
    }

    flags[flag] = !flags[flag];
    localStorage.setItem("dev-feature-flags", JSON.stringify(flags));

    // Trigger a custom event to notify components
    window.dispatchEvent(
      new CustomEvent("featureFlagToggled", {
        detail: { flag, enabled: flags[flag] },
      }),
    );
  }
}
