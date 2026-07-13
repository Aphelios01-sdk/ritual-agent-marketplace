"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Globe } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import type { Locale } from "@/lib/i18n/types"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, locales, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const current = locales.find((l) => l.id === locale) ?? locales[0]

  const pick = (id: Locale) => {
    setLocale(id)
    setOpen(false)
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:h-8"
        aria-label={t.common.language}
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="font-medium">{current.short}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 max-h-[min(70dvh,20rem)] min-w-[10.5rem] overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-card py-1 shadow-xl shadow-black/40">
          <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.common.language}
          </p>
          {locales.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => pick(l.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted sm:py-2",
                locale === l.id ? "text-primary" : "text-foreground",
              )}
            >
              <span>
                <span className="font-medium">{l.short}</span>
                <span className="ml-2 text-muted-foreground">{l.label}</span>
              </span>
              {locale === l.id && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
