/**
 * Typography scale (font size, line height, font family).
 * Font size entries are shared with the Tailwind preset via fontSize.json (single source of truth).
 */
import fontSizeJson from "./fontSize.json";

export { fontFamily } from "./fontFamily";
export const fontSize = fontSizeJson as typeof fontSizeJson;
