import fs from "node:fs";
import path from "node:path";

import { expect } from "vitest";

function normalizePrefix(prefix: string): string {
  return prefix.endsWith(".") ? prefix : `${prefix}.`;
}

/**
 * Asserts every entry in a feature translation map is scoped and non-empty.
 */
export function assertTranslationMap(map: Record<string, string>, requiredPrefix: string): void {
  assertTranslationMapWithAllowedPrefixes(map, [requiredPrefix]);
}

/**
 * Asserts keys match at least one allowed prefix (e.g. documents.* and documents_upload.*).
 */
export function assertTranslationMapWithAllowedPrefixes(
  map: Record<string, string>,
  allowedPrefixes: string[]
): void {
  const prefixes = allowedPrefixes.map(normalizePrefix);
  for (const [key, value] of Object.entries(map)) {
    expect(
      prefixes.some((prefix) => key.startsWith(prefix)),
      `key should match one of [${prefixes.join(", ")}]: ${key}`
    ).toBe(true);
    expect(typeof value, key).toBe("string");
    expect(value.length, key).toBeGreaterThan(0);
  }
}

/**
 * Asserts each key exists in the map with a non-empty string value.
 */
export function assertKeysResolve(map: Record<string, string>, keys: string[]): void {
  for (const key of keys) {
    const value = map[key];
    expect(value, `missing translation for ${key}`).toBeDefined();
    expect(typeof value, key).toBe("string");
    expect(value.length, key).toBeGreaterThan(0);
  }
}

const T_CALL_PATTERN = /\bt\s*\(\s*["']([^"']+)["']/g;
const TRANSLATIONS_INDEX_PATTERN =
  /(?:[A-Z_]+_TRANSLATIONS|TRANSLATIONS)\s*\[\s*["']([^"']+)["']\s*\]/g;

function collectKeysFromContent(content: string): Set<string> {
  const keys = new Set<string>();
  for (const pattern of [T_CALL_PATTERN, TRANSLATIONS_INDEX_PATTERN]) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1]?.trim();
      if (key && !key.includes("${")) {
        keys.add(key);
      }
    }
  }
  return keys;
}

function walkDir(dir: string, extensions: string[], ignoreDirNames: Set<string>): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoreDirNames.has(entry.name)) continue;
      files.push(...walkDir(path.join(dir, entry.name), extensions, ignoreDirNames));
      continue;
    }
    const ext = path.extname(entry.name);
    if (
      extensions.includes(ext) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx")
    ) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

/**
 * Scans a directory tree for t("key") and *_TRANSLATIONS["key"] usages.
 */
export function collectTranslationKeysUsedInDir(
  dir: string,
  extensions: string[] = [".ts", ".tsx"],
  options?: { ignoreDirNames?: string[] }
): string[] {
  const ignoreDirNames = new Set(options?.ignoreDirNames ?? ["node_modules", "__tests__"]);
  const keys = new Set<string>();
  for (const file of walkDir(dir, extensions, ignoreDirNames)) {
    const content = fs.readFileSync(file, "utf8");
    for (const key of collectKeysFromContent(content)) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}

/**
 * Filters keys to those matching a feature prefix (e.g. "search.").
 */
export function keysWithPrefix(keys: string[], prefix: string): string[] {
  const normalized = normalizePrefix(prefix);
  return keys.filter((k) => k.startsWith(normalized));
}

export function keysWithAnyPrefix(keys: string[], prefixes: string[]): string[] {
  const normalized = prefixes.map(normalizePrefix);
  return keys.filter((k) => normalized.some((prefix) => k.startsWith(prefix)));
}
