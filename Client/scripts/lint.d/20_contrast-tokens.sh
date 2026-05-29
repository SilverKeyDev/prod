#!/usr/bin/env bash
# WCAG 2.1 AA contrast check for semantic text tokens on background-base.
set -euo pipefail

node <<'NODE'
const pairs = [
  ["#2D2D2A", "#F7F6F2", "text-primary on background-base", 4.5],
  ["#6B6B65", "#F7F6F2", "text-secondary on background-base", 4.5],
  ["#646663", "#F7F6F2", "text-tertiary on background-base", 4.5],
  ["#FFFFFF", "#5E7A5F", "white on primary button", 4.5],
];

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

let failed = false;
for (const [fg, bg, label, min] of pairs) {
  const ratio = contrast(fg, bg);
  const ok = ratio >= min;
  console.log(`${ok ? "OK" : "FAIL"} ${label}: ${ratio.toFixed(2)}:1 (min ${min}:1)`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
NODE
