/**
 * Fixed height for header bar rows (44px). Use on layout containers (flex rows) so
 * the strip aligns; interactive shells should prefer {@link HEADER_ROW_CONTROL_HEIGHT}.
 */
export const HEADER_ROW_HEIGHT = "h-11 min-h-11 max-h-11";

/**
 * Same 44px as {@link HEADER_ROW_HEIGHT}, with Tailwind `!` so height wins over responsive
 * `h-*` / `min-h-*` from Button / IconButton size tokens (otherwise stylesheet order can
 * let size tokens override trailing classes).
 */
export const HEADER_ROW_CONTROL_HEIGHT = "!h-11 !min-h-11 !max-h-11";
