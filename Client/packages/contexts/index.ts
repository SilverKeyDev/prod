// Thin barrel: i18n and theme only. Store/auth/feature hooks live in packages/hooks/store and feature modules.

export { LocalizationProvider, useLocalization } from "./LocalizationContext";
export {
  type ThemeConfig,
  ThemeContext,
  type ThemeContextType,
  defaultConfig as themeDefaultConfig,
  type ThemeMode,
  type ThemeProviderProps,
  useTheme,
} from "./ThemeContext";
