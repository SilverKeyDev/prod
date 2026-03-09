/**
 * Local entry point for Expo (monorepo/pnpm).
 * Replaces "expo/AppEntry.js" so Metro serves the bundle from the app root
 * (e.g. /index.bundle?platform=web) instead of a deep node_modules path,
 * avoiding 404 and "MIME type application/json" errors on web.
 *
 * Note: Do not use the literal ESM meta token in this file (e.g. in string checks);
 * Metro's transformer flags it for web bundles. Use IMPORT_META_LABEL for runtime checks/logs instead.
 *
 * IMPORTANT: react-native-gesture-handler and react-native-reanimated must be imported
 * at the very top of the entry file so their native modules initialize before any worklets run.
 *
 * We register a root that lazy-loads App so "main" is registered before any Reanimated worklets
 * or other heavy imports run, avoiding "main has not been registered" when Reanimated fails to
 * initialize (e.g. under New Architecture / bridgeless).
 */
import "react-native-gesture-handler";
import "react-native-reanimated";

import { type ComponentType, useEffect, useState } from "react";

import { registerRootComponent } from "expo";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { log, LOG_CATEGORIES } from "packages/logger";

// Avoid literal ESM meta token in source so Metro web transformer does not false-positive
const IMPORT_META_LABEL = "import" + ".meta";

// Log exact source of uncaught errors so run-mobile.sh / Metro output shows where errors come from
function reportUncaughtError(message: string, stack?: string, source?: string): void {
  const location = source ? ` at ${source}` : "";
  const full = stack ? `${message}${location}\n${stack}` : `${message}${location}`;
  log.error(LOG_CATEGORIES.ERRORS, "[Uncaught error]" + location, new Error(full));
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.onerror = function (msg, url, line, col, err) {
    const source = url != null ? `${url}:${line ?? "?"}:${col ?? "?"}` : undefined;
    reportUncaughtError(String(msg), err?.stack, source);
    if (typeof msg === "string" && msg.includes(IMPORT_META_LABEL)) {
      log.error(
        LOG_CATEGORIES.ERRORS,
        `[${IMPORT_META_LABEL}] error (script): ${url ?? "(no url)"}:${line ?? "?"}:${col ?? "?"}`,
        err ?? new Error(String(msg))
      );
    }
    return false;
  };
  window.addEventListener("unhandledrejection", function (event) {
    const err = event.reason;
    const message = err?.message ?? String(err);
    const stack = err?.stack;
    const source =
      err?.fileName != null
        ? `${err?.fileName}:${err?.lineNumber ?? "?"}:${err?.columnNumber ?? "?"}`
        : undefined;
    reportUncaughtError(message, stack, source);
    if (typeof message === "string" && message.includes(IMPORT_META_LABEL)) {
      log.error(
        LOG_CATEGORIES.ERRORS,
        `[${IMPORT_META_LABEL}] error (file): ${err?.fileName ?? "(no fileName)"}:${err?.lineNumber ?? "?"}:${err?.columnNumber ?? "?"}`,
        err ?? new Error(message)
      );
    }
  });
}

/** Root shell: registers "main" immediately, then lazy-loads App to avoid Reanimated init before mount. */
function Root() {
  const [AppComponent, setAppComponent] = useState<ComponentType<object> | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    import("./App")
      .then((m) => setAppComponent(() => m.default))
      .catch((err) => {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to load App", err);
        setLoadError(err instanceof Error ? err : new Error(String(err)));
      });
  }, []);

  if (loadError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!AppComponent) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  const App = AppComponent;
  return <App />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

registerRootComponent(Root);
