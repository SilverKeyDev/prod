#!/usr/bin/env node
/**
 * Heuristic audit: <Button usages without iconName= or icon= on the opening tag line.
 * Multi-line props are not analyzed; run from Client/: `node scripts/audit-button-icons.mjs`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SCOPES = ["packages/ui", "packages/features", "apps/web"];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.tsx$/.test(name)) acc.push(full);
  }
  return acc;
}

function auditFile(absPath) {
  const rel = path.relative(ROOT, absPath);
  const text = fs.readFileSync(absPath, "utf8");
  const lines = text.split("\n");
  const issues = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/<Button\b/.test(line)) continue;
    if (/iconName=/.test(line) || /\bicon=\{/.test(line)) continue;
    if (/icon=</.test(line)) continue;
    if (/CancelButton/.test(line)) continue;
    issues.push({ line: i + 1, snippet: line.trim().slice(0, 120) });
  }
  return issues.length ? { rel, issues } : null;
}

const files = SCOPES.flatMap((s) => walk(path.join(ROOT, s)));
const reports = files.map(auditFile).filter(Boolean);

let total = 0;
for (const r of reports) {
  total += r.issues.length;
  console.log(`${r.rel}`);
  for (const iss of r.issues) console.log(`  L${iss.line}: ${iss.snippet}`);
}
console.log(`\nTotal single-line Button openings without icon props (heuristic): ${total}`);
process.exit(reports.length ? 0 : 0);
