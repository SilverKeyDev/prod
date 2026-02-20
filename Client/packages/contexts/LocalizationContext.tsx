import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { dateParseISO } from "packages/utils/core/date";
import { getDocument as _getDocument } from "packages/utils/core/platform";

/**
 * Localization context for non-state i18n concerns (English only).
 * Handles translation utilities and formatting.
 * Does NOT manage locale state - that should be in Zustand stores.
 */
export type Locale = "en";

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

import { TRANSLATIONS } from "./translations";

const translate = (key: string, params?: Record<string, unknown>): string => {
  const translation = TRANSLATIONS[key] ?? key;

  if (params) {
    return translation.replace(/\{\{(\w+)\}\}/g, (_match, param) => {
      return String(params[param] ?? _match);
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

  // Set document language to English
  useEffect(() => {
    const doc = _getDocument();
    if (doc?.documentElement) doc.documentElement.lang = "en";
  }, []);

  const t = (key: string, params?: Record<string, unknown>): string => {
    return translate(key, params);
  };

  const formatDate = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
  ): string => {
    const dateObj =
      typeof date === "string" ? dateParseISO(date).toDate() : date;
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
    const dateObj =
      typeof date === "string" ? dateParseISO(date).toDate() : date;
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
