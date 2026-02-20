/**
 * Platform-import linter: finds *.web.* and *.native.* files and warns when
 * they import components that are only used by one platform but do not have the
 * matching platform extension (.web.* or .native.*). Such components are
 * effectively platform-specific and should be renamed so the right variant is
 * used in each build.
 *
 * Also fails if the same logical component has both .mobile.* and .native.*
 * (mixed convention); we standardize on .native.* for React Native.
 *
 * Run from Client root: node tools/check-platform-imports.mjs
 * Exit code: 0 if no warnings/errors, 1 if any (so CI can fail).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PLATFORM_SUFFIXES = [".web", ".native"];
const PLATFORM_EXTENSIONS = [".tsx", ".ts"];
const ALL_PLATFORM_PATTERNS = PLATFORM_SUFFIXES.flatMap((s) =>
  PLATFORM_EXTENSIONS.map((e) => s + e),
);
const TRY_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

/** Paths to scan for platform files (relative to ROOT). */
const SCAN_DIRS = ["apps/web", "apps/mobile"];

/** Regex to capture module specifier from: from "..." or from '...' */
const FROM_REGEX = /from\s+["']([^"']+)["']/g;

/** True if specifier is a local/app import we should resolve (not node_modules). */
function isLocalImport(specifier) {
  if (!specifier || specifier.startsWith(".") || specifier.startsWith("@/"))
    return true;
  if (
    specifier.startsWith("react") ||
    specifier.startsWith("react-dom") ||
    specifier.startsWith("lucide-react") ||
    specifier.startsWith("@tanstack") ||
    specifier.startsWith("react-router") ||
    specifier.startsWith("react-virtuoso") ||
    specifier.startsWith("zustand") ||
    specifier.includes("node_modules")
  )
    return false;
  if (specifier.startsWith("packages/")) return false;
  return true;
}

/** Resolve import specifier from importer file path. Returns absolute path or null. */
function resolveImport(importerPath, specifier, appRoot) {
  let tryPath;
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    tryPath = path.join(appRoot, rel);
  } else if (specifier.startsWith(".")) {
    tryPath = path.resolve(path.dirname(importerPath), specifier);
  } else {
    return null;
  }

  const ext = path.extname(tryPath);
  if (ext && TRY_EXTENSIONS.includes(ext)) {
    if (fs.existsSync(tryPath)) return path.normalize(tryPath);
    return null;
  }

  for (const e of TRY_EXTENSIONS) {
    const withExt = tryPath + e;
    if (fs.existsSync(withExt)) return path.normalize(withExt);
  }
  const tryDir = tryPath;
  for (const e of TRY_EXTENSIONS) {
    const indexFile = path.join(tryDir, "index" + e);
    if (fs.existsSync(indexFile)) return path.normalize(indexFile);
  }
  return null;
}

function* walk(dir, pred) {
  if (!fs.existsSync(dir)) return;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        if (
          ent.name === "node_modules" ||
          ent.name === "dist" ||
          ent.name === "build" ||
          ent.name === "coverage"
        )
          continue;
        stack.push(full);
      } else if (ent.isFile() && pred(full)) {
        yield full;
      }
    }
  }
}

function getPlatform(fullPath) {
  const base = path.basename(fullPath);
  if (base.includes(".web.")) return "web";
  if (base.includes(".native.")) return "native";
  return null;
}

function hasPlatformExtension(fullPath, platform) {
  const base = path.basename(fullPath);
  if (platform === "web") return base.includes(".web.");
  if (platform === "native") return base.includes(".native.");
  return false;
}

function extractImports(content) {
  const specifiers = [];
  let m;
  FROM_REGEX.lastIndex = 0;
  while ((m = FROM_REGEX.exec(content)) !== null) {
    specifiers.push(m[1]);
  }
  return specifiers;
}

/**
 * Find logical component key (dir + base name without .web/.native/.mobile and extension).
 * e.g. apps/web/foo/Bar.web.tsx -> apps/web/foo/Bar
 */
function logicalKey(fullPath) {
  const rel = path.relative(ROOT, fullPath).replaceAll("\\", "/");
  const dir = path.dirname(rel);
  let base = path.basename(fullPath);
  for (const suf of [".web", ".native", ".mobile"]) {
    const idx = base.indexOf(suf);
    if (idx !== -1) {
      base = base.slice(0, idx);
      break;
    }
  }
  return `${dir}/${base}`;
}

/** Returns "web" | "native" | "mobile" if file has that platform suffix, else null. */
function getPlatformSuffixKind(fullPath) {
  const base = path.basename(fullPath);
  if (base.includes(".web.")) return "web";
  if (base.includes(".native.")) return "native";
  if (base.includes(".mobile.")) return "mobile";
  return null;
}

/**
 * Check for mixed convention: same logical component with both .mobile.* and .native.*.
 * Returns list of { logicalKey, mobileFiles, nativeFiles }.
 */
function findMixedConvention() {
  const byLogical = new Map();

  for (const dir of SCAN_DIRS) {
    const absDir = path.join(ROOT, dir);
    if (!fs.existsSync(absDir)) continue;
    for (const file of walk(absDir, (f) => {
      const base = path.basename(f);
      return base.includes(".mobile.") || base.includes(".native.");
    })) {
      const key = logicalKey(file);
      const kind = getPlatformSuffixKind(file);
      if (!kind) continue;
      if (!byLogical.has(key)) byLogical.set(key, { mobile: [], native: [] });
      const entry = byLogical.get(key);
      if (kind === "mobile") entry.mobile.push(path.relative(ROOT, file));
      if (kind === "native") entry.native.push(path.relative(ROOT, file));
    }
  }

  const mixed = [];
  for (const [key, { mobile, native }] of byLogical) {
    if (mobile.length > 0 && native.length > 0) {
      mixed.push({ logicalKey: key, mobileFiles: mobile, nativeFiles: native });
    }
  }
  return mixed;
}

function run() {
  const mixed = findMixedConvention();
  if (mixed.length > 0) {
    return {
      warnings: [],
      mixedConvention: mixed,
      exitCode: 1,
      skipped: false,
    };
  }

  const platformFiles = [];
  for (const dir of SCAN_DIRS) {
    const absDir = path.join(ROOT, dir);
    for (const file of walk(absDir, (f) =>
      ALL_PLATFORM_PATTERNS.some((pat) => f.endsWith(pat)),
    )) {
      platformFiles.push({ path: file, platform: getPlatform(file) });
    }
  }

  if (platformFiles.length === 0) {
    return { warnings: [], mixedConvention: [], exitCode: 0, skipped: true };
  }

  const resolvedToImporters = new Map();

  const appsWebRoot = path.join(ROOT, "apps", "web");
  const appsMobileRoot = path.join(ROOT, "apps", "mobile");

  // Skip barrel files (index.*) so we only flag direct imports of platform-only modules,
  // not every re-export through a barrel.
  const isBarrel = (p) => path.basename(p).startsWith("index");

  for (const { path: importerPath, platform } of platformFiles) {
    if (isBarrel(importerPath)) continue;
    const content = fs.readFileSync(importerPath, "utf8");
    const specifiers = extractImports(content);
    const appRootForResolve = importerPath.startsWith(appsWebRoot)
      ? appsWebRoot
      : appsMobileRoot;

    for (const spec of specifiers) {
      if (!isLocalImport(spec)) continue;
      const resolved = resolveImport(importerPath, spec, appRootForResolve);
      if (!resolved) continue;
      const underWeb = resolved.startsWith(appsWebRoot);
      const underMobile = resolved.startsWith(appsMobileRoot);
      if (!underWeb && !underMobile) continue;
      if (!resolvedToImporters.has(resolved))
        resolvedToImporters.set(resolved, []);
      resolvedToImporters.get(resolved).push({ importerPath, platform });
    }
  }

  const warnings = [];
  for (const [resolvedPath, importers] of resolvedToImporters) {
    const platforms = new Set(importers.map((i) => i.platform));
    if (platforms.size > 1) continue;
    const platform = [...platforms][0];
    if (hasPlatformExtension(resolvedPath, platform)) continue;
    const relPath = path.relative(ROOT, resolvedPath);
    warnings.push({
      file: relPath,
      platform,
      onlyImportedBy: importers.map((i) => path.relative(ROOT, i.importerPath)),
    });
  }

  return {
    warnings,
    mixedConvention: [],
    exitCode: warnings.length ? 1 : 0,
    skipped: false,
  };
}

const result = run();
const { warnings, mixedConvention, exitCode, skipped } = result;

if (mixedConvention.length > 0) {
  console.error(
    "Platform-import linter: mixed convention detected. Use .native.* for React Native only (not .mobile.*).\n",
  );
  for (const m of mixedConvention) {
    console.error(`  Logical component: ${m.logicalKey}`);
    console.error(`    .mobile.* files: ${m.mobileFiles.join(", ")}`);
    console.error(`    .native.* files: ${m.nativeFiles.join(", ")}`);
    console.error(
      "  Remove .mobile.* variant and use .native.* only, or rename to shared and use .web.* / .native.* consistently.\n",
    );
  }
  process.exit(1);
}

if (warnings.length) {
  console.error(
    "Platform-import linter: components only used by one platform should use that platform extension.\n",
  );
  for (const w of warnings) {
    console.error(
      `  ${w.file} is only imported by ${w.platform} files but does not have .${w.platform}.* extension.`,
    );
    for (const imp of w.onlyImportedBy.slice(0, 5)) {
      console.error(`    <- ${imp}`);
    }
    if (w.onlyImportedBy.length > 5)
      console.error(`    ... and ${w.onlyImportedBy.length - 5} more`);
    const ext = path.extname(w.file);
    const base = path.basename(w.file, ext);
    const hasAlready = base.endsWith(".web") || base.endsWith(".native");
    const suggestion = hasAlready
      ? w.file
      : `${path.dirname(w.file)}/${path.basename(w.file, ext)}.${w.platform}${ext}`;
    console.error(`  Consider renaming to ${path.basename(suggestion)}\n`);
  }
  process.exit(exitCode);
}

console.log(
  skipped
    ? "No *.web.* or *.native.* platform files found. Platform-import check skipped."
    : "Platform-import check passed (no mixed .mobile/.native convention; no platform-only imports without matching extension).",
);
