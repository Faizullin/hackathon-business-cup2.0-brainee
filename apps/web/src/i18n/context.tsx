"use client";

import { createContext, type ReactNode, useContext } from "react";
import { translateContent } from "./content";
import { en } from "./en";
import type { Dictionary, Locale } from "./types";

export const DEFAULT_LOCALE: Locale = "en";

export interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  /** Seeded content or game titles, with legacy Russian strings shown in English. */
  tc: (text: string) => string;
}

const value: I18nContextValue = { locale: DEFAULT_LOCALE, t: en, tc: translateContent };

const I18nContext = createContext<I18nContextValue>(value);

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
