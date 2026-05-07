#!/usr/bin/env node
/**
 * Lists imports from packages/features/<OtherFeature>/ where OtherFeature differs from
 * the containing feature folder (cross-feature edges). Same-feature imports are ignored.
 *
 * Usage: node scripts/duplication/audit-cross-feature-imports.mjs [--json]
 */

import fs from "node:fs";
import path from "node:path";

const CLIENT_ROOT = path.resolve(import.meta.dirname, "../..");
const FEATURES_ROOT = path.join(CLIENT_ROOT, "packages", "features");

const IMPORT_RE = /from\s+["'](packages\/features\/([^/'"]+)(?:\/[^'"]*)?)["']/g;

function featureDirFromFile(absPath) {
  const rel = path.relative(FEATURES_ROOT, absPath);
  const first = rel.split(path.sep)[0];
  return first && !first.startsWith("..") ? first : null;
}

function walkTsFiles(root, out) {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === "dist") continue;
        stack.push(full);
      } else if (/\.(tsx|ts)$/.test(e.name)) {
        out.push(full);
      }
    }
  }
}

function parseArgs(argv) {
  return { json: argv.includes("--json") };
}

function main() {
  const { json } = parseArgs(process.argv.slice(2));
  const files = [];
  walkTsFiles(FEATURES_ROOT, files);

  /** @type {Map<string, { from: string; to: string; importPath: string }[]>} */
  const edgeMap = new Map();

  for (const abs of files) {
    const fromFeat = featureDirFromFile(abs);
    if (!fromFeat) continue;

    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }

    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(text)) !== null) {
      const importPath = m[1];
      const toFeat = m[2];
      if (toFeat === fromFeat) continue;

      const key = `${fromFeat}\t${toFeat}`;
      const list = edgeMap.get(key) ?? [];
      list.push({
        from: fromFeat,
        to: toFeat,
        importPath,
        file: path.relative(CLIENT_ROOT, abs).split(path.sep).join("/"),
      });
      edgeMap.set(key, list);
    }
  }

  const edges = [...edgeMap.entries()]
    .map(([key, refs]) => {
      const [from, to] = key.split("\t");
      return { from, to, count: refs.length, refs };
    })
    .sort((a, b) => b.count - a.count || a.from.localeCompare(b.from));

  if (json) {
    console.log(JSON.stringify({ edges }, null, 2));
    return;
  }

  for (const { from, to, count, refs } of edges) {
    console.log(`${from} -> ${to} (${count})`);
    const seen = new Set();
    for (const r of refs) {
      const line = `  ${r.file}`;
      if (seen.has(line)) continue;
      seen.add(line);
      console.log(line);
    }
    console.log("");
  }
}

main();
