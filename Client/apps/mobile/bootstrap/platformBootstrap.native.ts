/**
 * React Native platform bootstrap. Runs before or at app root so shared packages
 * (store, utils/storage, platform adapter) get RN-safe implementations.
 * No document/window; storage via AsyncStorage with in-memory sync cache.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StateStorage } from "zustand/middleware";

import { setPlatformGlobals } from "packages/utils/core/platform";
import {
  type KeyValueStorage,
  type PlatformStorageConfig,
  setPlatformStorage,
} from "packages/utils/core/storage/platformStorage";

const PERSIST_PREFIX = "@sk_persist/";
const LOCAL_PREFIX = "@sk_local/";
const SESSION_PREFIX = "@sk_session/";

function createAsyncStorageAdapter(
  prefix: string,
  initialCache: Map<string, string>
): KeyValueStorage {
  return {
    getItem(key: string): string | null {
      return initialCache.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      initialCache.set(key, value);
      void AsyncStorage.setItem(prefix + key, value);
    },
    removeItem(key: string): void {
      initialCache.delete(key);
      void AsyncStorage.removeItem(prefix + key);
    },
    clear(): void {
      initialCache.clear();
      void AsyncStorage.getAllKeys().then((keys) => {
        const toRemove = keys.filter((k) => k.startsWith(prefix));
        if (toRemove.length > 0) void AsyncStorage.multiRemove(toRemove);
      });
    },
  };
}

function createPersistStorageFromKV(kv: KeyValueStorage): StateStorage {
  return {
    getItem: (name: string) => kv.getItem(name),
    setItem: (name: string, value: string) => {
      kv.setItem(name, value);
    },
    removeItem: (name: string) => {
      kv.removeItem(name);
    },
  };
}

async function loadPrefix(prefix: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const keys = await AsyncStorage.getAllKeys();
  const ourKeys = keys.filter((k) => k.startsWith(prefix));
  if (ourKeys.length > 0) {
    const pairs = await AsyncStorage.multiGet(ourKeys);
    for (const [k, v] of pairs) {
      if (k != null && v != null) map.set(k.slice(prefix.length), v);
    }
  }
  return map;
}

/**
 * Call once at app startup (e.g. before rendering root). Loads AsyncStorage into
 * in-memory caches (so shared sync getItem works), then sets platform storage
 * and globals for React Native. No document/window; fetch uses global fetch.
 * Must be awaited before mounting providers that use storage/auth.
 */
export async function runPlatformBootstrap(): Promise<void> {
  const [persistMap, localMap, sessionMap] = await Promise.all([
    loadPrefix(PERSIST_PREFIX),
    loadPrefix(LOCAL_PREFIX),
    loadPrefix(SESSION_PREFIX),
  ]);

  const persistKV = createAsyncStorageAdapter(PERSIST_PREFIX, persistMap);
  const localKV = createAsyncStorageAdapter(LOCAL_PREFIX, localMap);
  const sessionKV = createAsyncStorageAdapter(SESSION_PREFIX, sessionMap);

  const config: PlatformStorageConfig = {
    persistStorage: createPersistStorageFromKV(persistKV),
    local: localKV,
    session: sessionKV,
  };
  setPlatformStorage(config);

  setPlatformGlobals({
    window: null,
    document: null,
    navigator: null,
    fetch:
      typeof globalThis !== "undefined" && "fetch" in globalThis
        ? (globalThis as unknown as { fetch: typeof fetch }).fetch
        : undefined,
  });
}
