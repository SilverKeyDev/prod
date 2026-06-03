import { log } from "packages/logger";

const DEFAULT_SCORE = 3;

type LoosePro = { text?: unknown; score?: unknown };
type LooseCon = { text?: unknown; severity?: unknown; score?: unknown };

function clampScore(n: unknown): number {
  if (n === undefined || n === null) {
    return DEFAULT_SCORE;
  }
  let x: number;
  if (typeof n === "number" && Number.isFinite(n)) {
    x = Math.round(n);
  } else if (typeof n === "string" && n.trim() !== "") {
    const p = Number(n);
    x = Number.isFinite(p) ? Math.round(p) : Number.NaN;
  } else {
    x = Number.NaN;
  }
  if (Number.isNaN(x)) {
    return DEFAULT_SCORE;
  }
  return Math.max(1, Math.min(5, x));
}

/** Normalize a pro entry from API (string legacy or structured object). */
export function normalizeProEntry(raw: unknown): {
  text: string;
  score: number;
} {
  if (typeof raw === "string") {
    log.debug("SEARCH", "legacy_pro_con_string_payload", { kind: "pro" });
    const text = raw.trim();
    return { text, score: DEFAULT_SCORE };
  }
  if (raw && typeof raw === "object" && "text" in raw) {
    const o = raw as LoosePro;
    const text = String(o.text ?? "").trim();
    return { text, score: clampScore(o.score) };
  }
  return { text: "", score: DEFAULT_SCORE };
}

/** Normalize a con entry from API (string legacy or structured object). */
export function normalizeConEntry(raw: unknown): {
  text: string;
  severity: "red_flag" | "warning";
  score: number;
} {
  if (typeof raw === "string") {
    log.debug("SEARCH", "legacy_pro_con_string_payload", { kind: "con" });
    const text = raw.trim();
    return { text, severity: "warning", score: DEFAULT_SCORE };
  }
  if (raw && typeof raw === "object" && "text" in raw) {
    const o = raw as LooseCon;
    const text = String(o.text ?? "").trim();
    const s = String(o.severity ?? "")
      .toLowerCase()
      .replace(/-/g, "_");
    const severity = s === "red_flag" || s === "redflag" ? "red_flag" : "warning";
    return { text, severity, score: clampScore(o.score) };
  }
  return { text: "", severity: "warning", score: DEFAULT_SCORE };
}
