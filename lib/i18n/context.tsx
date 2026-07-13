"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { MESSAGES } from "./messages"
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  type Locale,
  type Messages,
} from "./types"

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Messages
  locales: typeof LOCALES
}

const I18nContext = createContext<I18nContextValue | null>(null)

function isLocale(v: string | null | undefined): v is Locale {
  return v === "en" || v === "id" || v === "zh" || v === "ko"
}

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    /* SSR / private mode - use default */
  }
  const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en"
  if (nav.startsWith("id")) return "id"
  if (nav.startsWith("zh")) return "zh"
  if (nav.startsWith("ko")) return "ko"
  return "en"
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
      document.documentElement.lang =
        locale === "zh" ? "zh-CN" : locale === "ko" ? "ko" : locale === "id" ? "id" : "en"
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: MESSAGES[locale] ?? MESSAGES.en,
      locales: LOCALES,
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Fallback for SSR edge cases
    return {
      locale: DEFAULT_LOCALE as Locale,
      setLocale: () => {},
      t: MESSAGES.en,
      locales: LOCALES,
    }
  }
  return ctx
}

export function useT() {
  return useI18n().t
}
