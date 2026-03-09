#!/usr/bin/env node

/**
 * Refactor primitive imports to use shared modules defined in
 * Client/packages/config/platform/primitives.json.
 *
 * - packages/ui/components/index.web      -> "@/components/ui"
 * - packages/ui/components                -> "@/components/ui"
 * - "@/components/ui/index.web"           -> "@/components/ui"
 * - packages/ui/components/primitives/*   -> "packages/ui/components/primitives"
 * - react-native { ScrollView, Text, Image } in feature/UI code
 *   -> from "packages/ui/components/primitives"
 */

import fs from "node:fs";
import path from "node:path";

const clientRoot = new URL("..", import.meta.url).pathname;

const PRIMITIVES_MODULE = "packages/ui/components/primitives";
const UI_BARREL_MODULE = "@/components/ui";

const RN_PRIMITIVES = new Set(["ScrollView", "Text", "Image"]);

/** Recursively walk a directory and collect .ts/.tsx files. */
function collectTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and dist/build
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "build") {
        continue;
      }
      files.push(...collectTsFiles(full));
    } else if (entry.isFile()) {
      if (full.endsWith(".ts") || full.endsWith(".tsx")) {
        files.push(full);
      }
    }
  }

  return files;
}

/**
 * Rewrite import source strings according to our mapping table.
 */
function rewriteImportSources(code) {
  let next = code;

  // index.web and generic components barrel -> "@/components/ui"
  next = next.replace(
    /from\s+["']packages\/ui\/components\/index\.web["']/g,
    `from "${UI_BARREL_MODULE}"`
  );
  next = next.replace(/from\s+["']packages\/ui\/components["']/g, `from "${UI_BARREL_MODULE}"`);
  next = next.replace(
    /from\s+["']@\/components\/ui\/index\.web["']/g,
    `from "${UI_BARREL_MODULE}"`
  );

  // Deep primitive imports -> primitives barrel
  next = next.replace(
    /from\s+["']packages\/ui\/components\/primitives\/(box|text|input|media)["']/g,
    `from "${PRIMITIVES_MODULE}"`
  );

  return next;
}

/**
 * Split react-native imports so ScrollView/Text/Image come from primitives.
 */
function rewriteReactNativeImports(code, filename) {
  // Do not touch shared RN primitives implementation files
  if (filename.includes("packages/ui/components/primitives")) {
    return code;
  }

  const importRegex = /import\s+\{([^}]+)\}\s+from\s+["']react-native["'];?/g;
  let match;
  let result = "";
  let lastIndex = 0;
  let changed = false;

  while ((match = importRegex.exec(code)) !== null) {
    const [fullMatch, specList] = match;
    const start = match.index;
    const end = importRegex.lastIndex;

    result += code.slice(lastIndex, start);

    const rawSpecs = specList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const rnSpecs = [];
    const primitiveSpecs = [];

    for (const spec of rawSpecs) {
      // spec can be "Name" or "Name as Alias"
      const [imported] = spec.split(/\s+as\s+/);
      if (RN_PRIMITIVES.has(imported.trim())) {
        primitiveSpecs.push(spec);
      } else {
        rnSpecs.push(spec);
      }
    }

    if (primitiveSpecs.length === 0) {
      // No primitives to split; keep original import
      result += fullMatch;
    } else {
      changed = true;
      if (rnSpecs.length > 0) {
        result += `import { ${rnSpecs.join(", ")} } from "react-native";\n`;
      }
      result += `import { ${primitiveSpecs.join(", ")} } from "${PRIMITIVES_MODULE}";\n`;
    }

    lastIndex = end;
  }

  if (!changed) {
    return code;
  }

  result += code.slice(lastIndex);
  return result;
}

function processFile(file) {
  const orig = fs.readFileSync(file, "utf8");
  let next = orig;

  next = rewriteImportSources(next);
  next = rewriteReactNativeImports(next, file);

  if (next !== orig) {
    fs.writeFileSync(file, next, "utf8");

    console.log(`Updated primitives imports in ${path.relative(clientRoot, file)}`);
  }
}

function main() {
  const roots = [
    path.join(clientRoot, "packages/features"),
    path.join(clientRoot, "packages/ui/components"),
    path.join(clientRoot, "apps/web"),
    path.join(clientRoot, "apps/mobile"),
  ];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const files = collectTsFiles(root);
    for (const file of files) {
      processFile(file);
    }
  }
}

main();
