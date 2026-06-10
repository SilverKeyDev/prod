import { useEffect, useState } from "react";

import type { ReactNode } from "react";

import { defaultConfig, type ThemeConfig, ThemeContext } from "packages/contexts/ThemeContext";
import { getDocument, getWindow } from "packages/utils/core/platform";

export type ThemeProviderWebProps = {
  children: ReactNode;
  initialConfig?: Partial<ThemeConfig>;
};

/**
 * Web-specific theme provider. Implements all DOM usage (matchMedia,
 * document.documentElement, setProperty, classList) and supplies the
 * theme context value. Use this at the web app root.
 */
export function ThemeProviderWeb({ children, initialConfig }: ThemeProviderWebProps) {
  const [config, setConfig] = useState<ThemeConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const mediaQuery = win.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDarkMode(mediaQuery.matches);
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDarkMode(e.matches);
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const root = getDocument()?.documentElement;
    if (!root) return;

    root.style.setProperty("--theme-primary", config.primaryColor);
    root.style.setProperty("--theme-accent", config.accentColor);
    root.style.setProperty("--theme-font-family", config.fontFamily);
    root.style.setProperty("--theme-border-radius", config.borderRadius);

    Object.entries(config.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--theme-spacing-${key}`, value);
    });

    const effectiveMode = config.mode === "system" ? systemTheme : config.mode;
    root.classList.remove("light", "dark");
    root.classList.add(effectiveMode);
  }, [config, systemTheme]);

  const applyTheme = (newConfig: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const getCSSVariable = (name: string): string => {
    const root = getDocument()?.documentElement;
    if (!root) return "";
    return getWindow()?.getComputedStyle(root).getPropertyValue(`--theme-${name}`).trim() ?? "";
  };

  const setCSSVariable = (name: string, value: string) => {
    getDocument()?.documentElement?.style.setProperty(`--theme-${name}`, value);
  };

  const value = {
    config,
    applyTheme,
    getCSSVariable,
    setCSSVariable,
    prefersDarkMode,
    systemTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
