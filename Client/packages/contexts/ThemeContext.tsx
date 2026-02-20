import { createContext, type ReactNode, useContext } from "react";

import { colors, themeSpacing } from "packages/design-tokens";

/**
 * Theme context for non-state theming concerns.
 * Handles theme configuration and theme utilities.
 * Does NOT manage theme state - that should be in Zustand stores.
 *
 * This file is dependency-pure: no window, document, or DOM APIs.
 * DOM application (matchMedia, document.documentElement, setProperty, classList)
 * is implemented by the web-specific provider (e.g. ThemeProviderWeb in apps/web).
 */
export type ThemeMode = "light" | "dark" | "system";

export type ThemeConfig = {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  spacing: Record<string, string>;
};

export type ThemeContextType = {
  config: ThemeConfig;
  applyTheme: (config: Partial<ThemeConfig>) => void;
  getCSSVariable: (name: string) => string;
  setCSSVariable: (name: string, value: string) => void;
  prefersDarkMode: boolean;
  systemTheme: "light" | "dark";
};

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export type ThemeProviderProps = {
  children: ReactNode;
  initialConfig?: Partial<ThemeConfig>;
};

export const defaultConfig: ThemeConfig = {
  mode: "system",
  primaryColor: colors.brand.primary,
  accentColor: colors.brown.muted,
  fontFamily: "Inter, system-ui, sans-serif",
  borderRadius: "0.5rem",
  spacing: { ...themeSpacing },
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
