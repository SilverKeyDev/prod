import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Theme context for non-state theming concerns
 * Handles theme configuration, CSS custom properties, and theme utilities
 * Does NOT manage theme state - that should be in Zustand stores
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
  // Theme configuration (non-state)
  config: ThemeConfig;

  // Theme utilities (non-state)
  applyTheme: (config: Partial<ThemeConfig>) => void;
  getCSSVariable: (name: string) => string;
  setCSSVariable: (name: string, value: string) => void;

  // Theme detection utilities
  prefersDarkMode: boolean;
  systemTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export type ThemeProviderProps = {
  children: ReactNode;
  initialConfig?: Partial<ThemeConfig>;
};

const defaultConfig: ThemeConfig = {
  mode: "system",
  primaryColor: "hsl(210, 20%, 25%)", // Muted navy from Tailwind config
  accentColor: "hsl(25, 18%, 45%)", // Muted brown accent
  fontFamily: "Inter, system-ui, sans-serif",
  borderRadius: "0.5rem",
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
};

export function ThemeProvider({ children, initialConfig }: ThemeProviderProps) {
  const [config, setConfig] = useState<ThemeConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDarkMode(mediaQuery.matches);
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDarkMode(e.matches);
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme configuration to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;

    // Set CSS custom properties
    root.style.setProperty("--theme-primary", config.primaryColor);
    root.style.setProperty("--theme-accent", config.accentColor);
    root.style.setProperty("--theme-font-family", config.fontFamily);
    root.style.setProperty("--theme-border-radius", config.borderRadius);

    // Set spacing variables
    Object.entries(config.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--theme-spacing-${key}`, value);
    });

    // Apply theme mode class
    const effectiveMode = config.mode === "system" ? systemTheme : config.mode;
    root.classList.remove("light", "dark");
    root.classList.add(effectiveMode);
  }, [config, systemTheme]);

  const applyTheme = (newConfig: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const getCSSVariable = (name: string): string => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--theme-${name}`)
      .trim();
  };

  const setCSSVariable = (name: string, value: string) => {
    document.documentElement.style.setProperty(`--theme-${name}`, value);
  };

  const value: ThemeContextType = {
    config,
    applyTheme,
    getCSSVariable,
    setCSSVariable,
    prefersDarkMode,
    systemTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
