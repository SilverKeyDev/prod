/**
 * Platform storage abstraction for shared packages.
 * Apps (e.g. apps/web) set implementations at bootstrap; packages use getters
 * so code stays React Native–safe (no direct window/localStorage/sessionStorage).
 */

import type { StateStorage } from "zustand/middleware";

/** Key-value storage interface (localStorage/sessionStorage-like). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export interface PlatformStorageConfig {
  /** Storage for zustand persist middleware (e.g. localStorage). */
  persistStorage: StateStorage;
  /** Local key-value storage (e.g. localStorage). */
  local: KeyValueStorage;
  /** Session key-value storage (e.g. sessionStorage). */
  session: KeyValueStorage;
}

let platformStorage: PlatformStorageConfig | null = null;

const persistMap = new Map<string, string>();
const localMap = new Map<string, string>();
const sessionMap = new Map<string, string>();

const inMemoryStateStorage: StateStorage = {
  getItem: (name: string) => persistMap.get(name) ?? null,
  setItem: (name: string, value: string) => {
    persistMap.set(name, value);
  },
  removeItem: (name: string) => {
    persistMap.delete(name);
  },
};

function createInMemoryKeyValueStorage(map: Map<string, string>): KeyValueStorage {
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
  };
}

const inMemoryLocal = createInMemoryKeyValueStorage(localMap);
const inMemorySession = createInMemoryKeyValueStorage(sessionMap);

/**
 * Set platform storage implementations. Call from app entry (e.g. apps/web) at bootstrap.
 */
export function setPlatformStorage(config: PlatformStorageConfig): void {
  platformStorage = config;
}

/**
 * Get storage for zustand persist middleware. Returns in-memory fallback when not set (SSR/RN).
 */
export function getPersistStorage(): StateStorage {
  if (platformStorage) {
    return platformStorage.persistStorage;
  }
  return inMemoryStateStorage;
}

/**
 * Get local key-value storage. Returns in-memory fallback when not set.
 */
export function getLocalStorage(): KeyValueStorage {
  if (platformStorage) {
    return platformStorage.local;
  }
  return inMemoryLocal;
}

/**
 * Get session key-value storage. Returns in-memory fallback when not set.
 */
export function getSessionStorage(): KeyValueStorage {
  if (platformStorage) {
    return platformStorage.session;
  }
  return inMemorySession;
}

/**
 * Proxy StateStorage that delegates to getPersistStorage() on every call.
 * Use this when creating persist middleware so storage can be set after module load.
 */
export function createPersistStorageProxy(): StateStorage {
  return {
    getItem: (name: string) => getPersistStorage().getItem(name),
    setItem: (name: string, value: string) => getPersistStorage().setItem(name, value),
    removeItem: (name: string) => getPersistStorage().removeItem(name),
  };
}
