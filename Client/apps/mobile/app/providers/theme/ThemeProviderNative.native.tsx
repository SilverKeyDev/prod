import { useEffect, useState } from "react";

import type { ReactNode } from "react";
import { Appearance, type ColorSchemeName } from "react-native";

import {
  defaultConfig,
  type ThemeConfig,
  ThemeContext,
  type ThemeContextType,
} from "packages/contexts/ThemeContext";

export type ThemeProviderNativeProps = {
  children: ReactNode;
  initialConfig?: Partial<ThemeConfig>;
};

/**
 * React Native theme provider. Uses Appearance.getColorScheme() and
 * Appearance.addChangeListener; no document/window. Supplies ThemeContext
 * so useTheme() works; getCSSVariable/setCSSVariable map to config for RN.
 */
export function ThemeProviderNative({ children, initialConfig }: ThemeProviderNativeProps) {
  const [config, setConfig] = useState<ThemeConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const systemTheme: "light" | "dark" = Appearance.getColorScheme() === "dark" ? "dark" : "light";
  const [prefersDarkMode, setPrefersDarkMode] = useState(systemTheme === "dark");

  useEffect(() => {
    const sub = Appearance.addChangeListener(
      ({ colorScheme }: { colorScheme: ColorSchemeName }) => {
        setPrefersDarkMode(colorScheme === "dark");
      }
    );
    return () => sub.remove();
  }, []);

  const applyTheme = (newConfig: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const varMap: Record<string, string> = {
    primary: config.primaryColor,
    accent: config.accentColor,
    "font-family": config.fontFamily,
    "border-radius": config.borderRadius,
    ...Object.fromEntries(Object.entries(config.spacing).map(([k, v]) => [`spacing-${k}`, v])),
  };

  const getCSSVariable = (name: string): string => {
    return varMap[name] ?? "";
  };

  const setCSSVariable = (_name: string, _value: string) => {
    // No-op on RN; theme is driven by config/context only
  };

  const value: ThemeContextType = {
    config,
    applyTheme,
    getCSSVariable,
    setCSSVariable,
    prefersDarkMode,
    systemTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
