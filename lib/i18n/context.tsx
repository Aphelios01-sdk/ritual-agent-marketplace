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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (isLocale(stored)) {
        setLocaleState(stored)
      } else {
        const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en"
        if (nav.startsWith("id")) setLocaleState("id")
        else if (nav.startsWith("zh")) setLocaleState("zh")
        else if (nav.startsWith("ko")) setLocaleState("ko")
        else setLocaleState("en")
      }
    } catch {
      /* SSR / private mode */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
      document.documentElement.lang =
        locale === "zh" ? "zh-CN" : locale === "ko" ? "ko" : locale === "id" ? "id" : "en"
    } catch {
      /* ignore */
    }
  }, [locale, ready])

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
