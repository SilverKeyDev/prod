/**
 * Web/native folder parity check.
 * Ensures apps/web and apps/mobile (or apps/native) feature trees match except
 * for platform-specific files (*.mobile.tsx, *.native.tsx, *.web.tsx, *.ios.tsx, *.android.tsx).
 * Skips any pair whose directories do not exist (e.g. when only web exists).
 * Run from Client root: node tools/check-parity.mjs
 * CI / pre-push: pnpm lint:all (or pnpm lint:parity when both web and native exist).
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const pairs = [
  {
    a: path.join(ROOT, "apps/web/features"),
    b: path.join(ROOT, "apps/mobile/features"),
    name: "features",
  },
];

const PLATFORM_SUFFIXES = [".mobile", ".native", ".web", ".ios", ".android"];

const EXTENSIONS = new Set([".ts", ".tsx"]);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        if (
          ent.name === "node_modules" ||
          ent.name === "dist" ||
          ent.name === "build"
        )
          continue;
        stack.push(full);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name);
        if (EXTENSIONS.has(ext)) out.push(full);
      }
    }
  }
  return out;
}

function canonicalKey(baseDir, filePath) {
  const rel = path.relative(baseDir, filePath).replaceAll("\\", "/");
  const dir = path.dirname(rel).replaceAll("\\", "/");
  const ext = path.extname(rel);
  let base = path.basename(rel, ext);

  for (const suf of PLATFORM_SUFFIXES) {
    if (base.endsWith(suf)) base = base.slice(0, -suf.length);
  }
  return `${dir}/${base}${ext}`;
}

function isPlatformSpecific(filePath) {
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  return PLATFORM_SUFFIXES.some((suf) => base.endsWith(suf));
}

function runPair({ a, b, name }) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) {
    console.log(
      `Parity check skipped [${name}]: one or both directories do not exist (${path.relative(ROOT, a)}, ${path.relative(ROOT, b)}).`,
    );
    return [];
  }

  const filesA = walk(a);
  const filesB = walk(b);

  const mapA = new Map();
  const mapB = new Map();

  for (const f of filesA) mapA.set(canonicalKey(a, f), f);
  for (const f of filesB) mapB.set(canonicalKey(b, f), f);

  const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);
  const errors = [];

  for (const key of allKeys) {
    const fa = mapA.get(key);
    const fb = mapB.get(key);

    if (!fa) {
      if (fb && isPlatformSpecific(fb)) continue;
      errors.push(
        `[${name}] Missing in A (web): ${key} (exists in B: ${path.relative(ROOT, fb)})`,
      );
    } else if (!fb) {
      if (fa && isPlatformSpecific(fa)) continue;
      errors.push(
        `[${name}] Missing in B (native): ${key} (exists in A: ${path.relative(ROOT, fa)})`,
      );
    }
  }

  return errors;
}

let allErrors = [];
for (const pair of pairs) {
  allErrors = allErrors.concat(runPair(pair));
}

if (allErrors.length) {
  console.error(
    "Parity check failed:\n" + allErrors.map((e) => " - " + e).join("\n"),
  );
  process.exit(1);
} else {
  console.log("Parity check passed.");
}
