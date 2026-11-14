"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { translateContent } from "./content";
import { en } from "./en";
import { ru } from "./ru";
import type { Dictionary, Locale } from "./types";

export const LOCALE_COOKIE = "brainee_locale";
export const DEFAULT_LOCALE: Locale = "en";

export const dictionaries: Record<Locale, Dictionary> = { en, ru };

export interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Dictionary;
  /** Seeded content or game titles in the current locale. */
  tc: (text: string) => string;
}

const defaultContext: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: en,
  tc: (text) => translateContent(text, DEFAULT_LOCALE),
};

const I18nContext = createContext<I18nContextValue>(defaultContext);

function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie persistence for Next.js SSR hydration
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  if (match && (match[1] === "en" || match[1] === "ru")) {
    return match[1] as Locale;
  }
  return null;
}

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setLocaleCookie(next);
    try {
      localStorage.setItem(LOCALE_COOKIE, next);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  useEffect(() => {
    const cookieLocale = getCookieLocale();
    let storedLocale: Locale | null = null;
    try {
      const val = localStorage.getItem(LOCALE_COOKIE);
      if (val === "en" || val === "ru") storedLocale = val as Locale;
    } catch {}

    const resolved = cookieLocale ?? storedLocale;
    if (resolved && resolved !== initialLocale) {
      setLocale(resolved);
    } else {
      setLocaleCookie(initialLocale);
      try {
        localStorage.setItem(LOCALE_COOKIE, initialLocale);
      } catch {}
      document.documentElement.lang = initialLocale;
    }
  }, [initialLocale, setLocale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE],
      tc: (text: string) => translateContent(text, locale),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
