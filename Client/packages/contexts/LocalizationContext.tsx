import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";

/**
 * Localization context for non-state i18n concerns
 * Handles locale configuration, translation utilities, and formatting
 * Does NOT manage locale state - that should be in Zustand stores
 */
export type Locale = "en" | "es" | "fr" | "de";

export type LocaleConfig = {
  locale: Locale;
  fallbackLocale: Locale;
  dateFormat: string;
  timeFormat: string;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
};

export type LocalizationContextType = {
  // Locale configuration (non-state)
  config: LocaleConfig;

  // Translation utilities (non-state)
  t: (key: string, params?: Record<string, unknown>) => string;
  formatDate: (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatTime: (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;

  // Locale detection utilities
  browserLocale: Locale;
  supportedLocales: Locale[];
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(
  undefined,
);

export type LocalizationProviderProps = {
  children: ReactNode;
  initialConfig?: Partial<LocaleConfig>;
};

const defaultConfig: LocaleConfig = {
  locale: "en",
  fallbackLocale: "en",
  dateFormat: "MM/dd/yyyy",
  timeFormat: "h:mm a",
  numberFormat: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  currencyFormat: {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
};

// Simple translation function (in a real app, this would load from translation files)
const translate = (
  key: string,
  params?: Record<string, unknown>,
  locale: Locale = "en",
): string => {
  // This is a placeholder - in a real app, you'd load translations from files
  const translations: Record<string, Record<Locale, string>> = {
    "common.save": {
      en: "Save",
      es: "Guardar",
      fr: "Enregistrer",
      de: "Speichern",
    },
    "common.cancel": {
      en: "Cancel",
      es: "Cancelar",
      fr: "Annuler",
      de: "Abbrechen",
    },
    "common.loading": {
      en: "Loading...",
      es: "Cargando...",
      fr: "Chargement...",
      de: "Laden...",
    },
    "common.error": {
      en: "An error occurred",
      es: "Ocurrió un error",
      fr: "Une erreur s'est produite",
      de: "Ein Fehler ist aufgetreten",
    },
  };

  const translation =
    translations[key]?.[locale] || translations[key]?.["en"] || key;

  // Simple parameter substitution
  if (params) {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return String(params[param] || match);
    });
  }

  return translation;
};

export function LocalizationProvider({
  children,
  initialConfig,
}: LocalizationProviderProps) {
  const [config] = useState<LocaleConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const [browserLocale, setBrowserLocale] = useState<Locale>("en");
  const supportedLocales: Locale[] = useMemo(
    () => ["en", "es", "fr", "de"],
    [],
  );

  // Detect browser locale
  useEffect(() => {
    const browserLang = navigator.language.split("-")[0] as Locale;
    const detectedLocale = supportedLocales.includes(browserLang)
      ? browserLang
      : "en";
    setBrowserLocale(detectedLocale);
  }, [supportedLocales]);

  // Set document language
  useEffect(() => {
    document.documentElement.lang = config.locale;
  }, [config.locale]);

  const t = (key: string, params?: Record<string, unknown>): string => {
    return translate(key, params, config.locale);
  };

  const formatDate = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    return new Intl.DateTimeFormat(config.locale, {
      ...defaultOptions,
      ...options,
    }).format(dateObj);
  };

  const formatTime = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return new Intl.DateTimeFormat(config.locale, {
      ...defaultOptions,
      ...options,
    }).format(dateObj);
  };

  const formatNumber = (
    number: number,
    options?: Intl.NumberFormatOptions,
  ): string => {
    const defaultOptions = { ...config.numberFormat, ...options };
    return new Intl.NumberFormat(config.locale, defaultOptions).format(number);
  };

  const formatCurrency = (amount: number, currency?: string): string => {
    const options = {
      ...config.currencyFormat,
      currency: currency || config.currencyFormat.currency,
    };
    return new Intl.NumberFormat(config.locale, options).format(amount);
  };

  const value: LocalizationContextType = {
    config,
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    browserLocale,
    supportedLocales,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error(
      "useLocalization must be used within a LocalizationProvider",
    );
  }
  return context;
}
