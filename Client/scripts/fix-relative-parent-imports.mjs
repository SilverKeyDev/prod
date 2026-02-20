#!/usr/bin/env node
/**
 * Fix silverkey/no-relative-parent-imports by replacing relative parent imports (../)
 * with path aliases: @/* for apps/web, packages/* for packages, logger for logger.
 * Run from Client/: node scripts/fix-relative-parent-imports.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve, relative, normalize } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_ROOT = resolve(__dirname, "..");

function extractPathFromMessage(message) {
  const single = message.match(/Replace '([^']+)'/);
  if (single) return single[1];
  const double = message.match(/Replace "([^"]+)"/);
  if (double) return double[1];
  return null;
}

function relativePathToAlias(filePath, importPath) {
  const dir = dirname(filePath);
  const abs = normalize(resolve(dir, importPath));
  let rel = relative(CLIENT_ROOT, abs);
  if (rel.startsWith("..")) return null;
  rel = rel.replace(/\\/g, "/");
  if (rel.startsWith("apps/web/"))
    return "@/".concat(rel.slice("apps/web/".length));
  if (rel.startsWith("packages/")) return rel;
  if (rel.startsWith("logger") || rel === "logger") return rel;
  return null;
}

function runEslintJson() {
  const r = spawnSync(
    "pnpm",
    [
      "exec",
      "eslint",
      ".",
      "--no-error-on-unmatched-pattern",
      "--format",
      "json",
    ],
    { cwd: CLIENT_ROOT, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 },
  );
  const out = (r.stdout || "").trim();
  if (!out || out.startsWith("Oops!")) return [];
  return JSON.parse(out);
}

function applyReplacements(filePath, replacements) {
  const byLine = new Map();
  for (const r of replacements) {
    if (!byLine.has(r.line)) byLine.set(r.line, []);
    byLine.get(r.line).push(r);
  }
  const lines = readFileSync(filePath, "utf-8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const reps = byLine.get(lineNum);
    if (!reps?.length) continue;
    let line = lines[i];
    for (const r of reps) {
      const q = r.oldPath.includes('"') ? "'" : '"';
      const oldQuoted = `${q}${r.oldPath}${q}`;
      const newQuoted = `${q}${r.newPath}${q}`;
      if (!line.includes(r.oldPath)) continue;
      line = line.replace(oldQuoted, newQuoted);
    }
    if (line !== lines[i]) lines[i] = line;
  }
  writeFileSync(filePath, lines.join("\n"), "utf-8");
}

function main() {
  const results = runEslintJson();
  const byFile = new Map();

  for (const result of results) {
    if (!result.messages?.length) continue;
    const filePath = result.filePath;
    if (!filePath.startsWith(CLIENT_ROOT)) continue;
    for (const msg of result.messages) {
      if (msg.ruleId !== "silverkey/no-relative-parent-imports") continue;
      const oldPath = extractPathFromMessage(msg.message);
      if (!oldPath) continue;
      const newPath = relativePathToAlias(filePath, oldPath);
      if (!newPath || newPath === oldPath) continue;
      if (!byFile.has(filePath)) byFile.set(filePath, []);
      byFile.get(filePath).push({ line: msg.line, oldPath, newPath });
    }
  }

  let total = 0;
  for (const [filePath, reps] of byFile) {
    const deduped = [];
    const seen = new Set();
    for (const r of reps) {
      const key = `${r.line}:${r.oldPath}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(r);
    }
    applyReplacements(filePath, deduped);
    total += deduped.length;
  }

  console.log(
    `Fixed ${total} relative parent import(s) across ${byFile.size} file(s).`,
  );
}

main();
