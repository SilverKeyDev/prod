#!/usr/bin/env node
/**
 * Auto-fix literal hex/hsl colors to design-token equivalents when the value
 * exactly matches a token. Use: color("path") for inline styles; Tailwind
 * theme class for className (e.g. text-brand-accent).
 *
 * Run from Client/: node scripts/fix-colors-to-tokens.mjs
 * Scopes: apps/web/components, apps/web/features, apps/web/pages
 */
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_ROOT = resolve(__dirname, "..");

/** Normalize hex to 6-char lowercase for comparison. */
function normalizeHex(str) {
  const s = String(str).trim().toLowerCase();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return null;
  if (s.length === 4) return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  if (s.length === 6) return s;
  return s.slice(0, 7); // #rrggbb from #rrggbbaa
}

/** Normalize hsl for comparison (no spaces). */
function normalizeHsl(str) {
  const s = String(str).trim().toLowerCase();
  const m = s.match(
    /^hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*(?:,\s*[\d.]+)?\s*\)$/,
  );
  if (m) return `hsl(${m[1]},${m[2]}%,${m[3]}%)`;
  const m2 = s.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)$/i);
  if (m2) return `hsl(${m2[1]},${m2[2]}%,${m2[3]}%)`;
  return null;
}

/** Flatten colors from design-tokens; value -> first token path (prefer semantic). */
const VALUE_TO_PATH = new Map();

const colorsFlat = {
  "brand.primary": "hsl(210, 20%, 25%)",
  "brand.accent": "#A3B18A",
  "brand.secondary": "hsl(85, 15%, 55%)",
  "brand.tertiary": "hsl(45, 20%, 75%)",
  "brown.DEFAULT": "#8C6F5A",
  "brown.light": "#8C6F5A",
  "brown.muted": "hsl(25, 18%, 45%)",
  "olive.DEFAULT": "#A3B18A",
  "olive.light": "#97a77b",
  "olive.muted": "hsl(85, 15%, 55%)",
  "beige.DEFAULT": "#D2C3A1",
  "beige.light": "#D2C3A1",
  "beige.muted": "hsl(45, 20%, 75%)",
  "gold.DEFAULT": "#D2C3A1",
  "gold.light": "#D2C3A1",
  "gold.lighter": "hsl(45, 30%, 80%)",
  "gold.muted": "hsl(45, 20%, 70%)",
  "rose.DEFAULT": "#F43F5E",
  "rose.light": "#FB7185",
  "rose.muted": "hsl(340, 20%, 55%)",
  "rose.50": "hsl(340, 20%, 95%)",
  "rose.100": "hsl(340, 20%, 90%)",
  "rose.800": "hsl(340, 20%, 25%)",
  "green.DEFAULT": "#16a34a",
  "green.light": "#22c55e",
  "green.muted": "hsl(142, 20%, 50%)",
  "green.50": "hsl(142, 20%, 95%)",
  "green.100": "hsl(142, 20%, 90%)",
  "green.200": "hsl(142, 20%, 85%)",
  "green.500": "hsl(142, 20%, 50%)",
  "green.600": "hsl(142, 20%, 40%)",
  "green.700": "hsl(142, 20%, 35%)",
  "green.800": "hsl(142, 20%, 25%)",
  "yellow.DEFAULT": "#eab308",
  "yellow.light": "#facc15",
  "yellow.muted": "hsl(45, 20%, 60%)",
  "yellow.50": "hsl(45, 20%, 95%)",
  "yellow.100": "hsl(45, 20%, 90%)",
  "yellow.700": "hsl(45, 20%, 40%)",
  "yellow.800": "hsl(45, 20%, 30%)",
  "blue.DEFAULT": "#2563eb",
  "blue.light": "#3b82f6",
  "blue.muted": "hsl(217, 20%, 50%)",
  "blue.50": "hsl(217, 20%, 95%)",
  "blue.100": "hsl(217, 20%, 90%)",
  "blue.500": "hsl(217, 20%, 50%)",
  "blue.600": "hsl(217, 20%, 40%)",
  "blue.800": "hsl(217, 20%, 25%)",
  "neutral.50": "hsl(0, 0%, 98%)",
  "neutral.100": "hsl(0, 0%, 96%)",
  "neutral.200": "hsl(0, 0%, 90%)",
  "neutral.300": "hsl(0, 0%, 83%)",
  "neutral.400": "hsl(0, 0%, 64%)",
  "neutral.500": "hsl(0, 0%, 45%)",
  "neutral.600": "hsl(0, 0%, 32%)",
  "neutral.700": "hsl(0, 0%, 25%)",
  "neutral.800": "hsl(0, 0%, 15%)",
  "neutral.900": "hsl(0, 0%, 9%)",
  "off-white": "#FAF9F6",
  "off-white-gray": "hsl(0, 0%, 96%)",
  navy: "#1A1F36",
  "dark-green": "#405541",
  "gray-brown": "#B8B3AB",
  "external.google.blue": "#4285F4",
  "external.google.green": "#34A853",
  "external.google.yellow": "#FBBC05",
  "external.google.red": "#EA4335",
};

for (const [path, value] of Object.entries(colorsFlat)) {
  const norm = value.startsWith("#")
    ? normalizeHex(value)
    : normalizeHsl(value);
  if (norm && !VALUE_TO_PATH.has(norm)) VALUE_TO_PATH.set(norm, path);
}
// Also register original hex/hsl as key so we can look up by raw value
for (const [path, value] of Object.entries(colorsFlat)) {
  const v = value.trim();
  if (!VALUE_TO_PATH.has(v)) VALUE_TO_PATH.set(v, path);
}

function pathToTailwindClass(path) {
  if (path.endsWith(".DEFAULT")) return path.slice(0, -8);
  return path.replace(/\./g, "-");
}

function getTokenPathForValue(rawValue) {
  if (!rawValue || typeof rawValue !== "string") return null;
  const trimmed = rawValue.trim();
  const byHex = normalizeHex(trimmed);
  const byHsl = normalizeHsl(trimmed);
  return (
    VALUE_TO_PATH.get(trimmed) ??
    (byHex && VALUE_TO_PATH.get(byHex)) ??
    (byHsl && VALUE_TO_PATH.get(byHsl)) ??
    null
  );
}

const INCLUDE_DIRS = [
  "apps/web/components",
  "apps/web/features",
  "apps/web/pages",
];
const DESIGN_TOKENS_DIR = "packages/design-tokens";

function* walkTsTsx(dir) {
  const full = resolve(CLIENT_ROOT, dir);
  try {
    const entries = readdirSync(full, { withFileTypes: true });
    for (const e of entries) {
      const p = join(full, e.name);
      const rel = p.slice(CLIENT_ROOT.length + 1).replace(/\\/g, "/");
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === "dist") continue;
        yield* walkTsTsx(rel);
      } else if (/\.(ts|tsx)$/.test(e.name)) yield rel;
    }
  } catch {
    // Ignore readdir errors (e.g. permission denied)
  }
}

function ensureColorImport(content) {
  const hasDesignTokens = /from\s+["']packages\/design-tokens["']/.test(
    content,
  );
  const hasColor =
    /import\s*\{\s*[^}]*\bcolor\b[^}]*\}\s*from\s+["']packages\/design-tokens["']/.test(
      content,
    );
  if (hasColor) return content;
  if (hasDesignTokens) {
    return content.replace(
      /(import\s*\{\s*)([^}]+)(\}\s*from\s+["']packages\/design-tokens["'])/,
      (_, open, names, close) => {
        if (names.includes("color")) return content;
        return open + names.trim().replace(/,?\s*$/, ", color ") + close;
      },
    );
  }
  const firstImport = content.match(/^import\s+.+$/m);
  const insert = 'import { color } from "packages/design-tokens";\n';
  if (firstImport) {
    return content.replace(/^import\s+.+$/m, (m) => m + "\n" + insert.trim());
  }
  return insert + "\n" + content;
}

function fixFile(filePath) {
  const full = resolve(CLIENT_ROOT, filePath);
  let content = readFileSync(full, "utf-8");
  let changed = false;

  // 1) Style-like literal color (after : or =) -> color("path")
  const literalColorRe =
    /(:\s*|=\s*)["'](#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})|hsl\s*\([^)]+\)|hsla\s*\([^)]+\))["']/g;
  content = content.replace(literalColorRe, (match, prefix, value) => {
    const path = getTokenPathForValue(value);
    if (path) {
      changed = true;
      return `${prefix}color("${path}")`;
    }
    return match;
  });

  // 2) Tailwind arbitrary color in className: text-[#hex], bg-[#hex], etc. -> text-brand-accent
  const arbitraryHexRe = /\[#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\]/g;
  content = content.replace(arbitraryHexRe, (match) => {
    const hex = "#" + match.slice(2, -1);
    const path = getTokenPathForValue(hex);
    if (path) {
      changed = true;
      return pathToTailwindClass(path);
    }
    return match;
  });

  if (changed && /color\s*\(\s*["']/.test(content)) {
    content = ensureColorImport(content);
  }

  if (changed) writeFileSync(full, content, "utf-8");
  return changed;
}

function main() {
  const files = [];
  for (const dir of INCLUDE_DIRS) {
    for (const f of walkTsTsx(dir)) files.push(f);
  }
  let fixed = 0;
  for (const f of files) {
    if (f.includes(DESIGN_TOKENS_DIR)) continue;
    if (fixFile(f)) fixed++;
  }
  console.log(`Fixed colors in ${fixed} file(s).`);
}

main();
