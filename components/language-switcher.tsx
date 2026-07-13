"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Check, Globe } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import type { Locale } from "@/lib/i18n/types"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  /** inline = always-visible list (mobile drawer). dropdown = popover (default). */
  variant?: "dropdown" | "inline"
}

export function LanguageSwitcher({ className, variant = "dropdown" }: Props) {
  const { locale, setLocale, locales, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const current = locales.find((l) => l.id === locale) ?? locales[0]

  const pick = (id: Locale) => {
    setLocale(id)
    setOpen(false)
  }

  // Position fixed menu under the button (avoids overflow:hidden / flex clipping on mobile)
  const updatePos = () => {
    const btn = btnRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const menuW = 168
    const pad = 8
    let left = r.left
    // Prefer align start on mobile; keep inside viewport
    if (left + menuW > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - menuW - pad)
    }
    if (left < pad) left = pad
    setMenuPos({ top: r.bottom + 6, left })
  }

  useLayoutEffect(() => {
    if (!open || variant !== "dropdown") return
    updatePos()
  }, [open, variant])

  useEffect(() => {
    if (!open || variant !== "dropdown") return
    const onScroll = () => updatePos()
    const onResize = () => updatePos()
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [open, variant])

  useEffect(() => {
    if (!open || variant !== "dropdown") return
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("touchstart", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("touchstart", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, variant])

  if (variant === "inline") {
    return (
      <div className={cn("w-full", className)}>
        <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t.common.language}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {locales.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => pick(l.id)}
              className={cn(
                "flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                locale === l.id
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              <span>
                <span className="font-semibold">{l.short}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{l.label}</span>
              </span>
              {locale === l.id && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 min-w-[3.25rem] shrink-0 items-center justify-center gap-1.5 rounded-full border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground active:bg-muted sm:h-8"
        aria-label={t.common.language}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">{current.short}</span>
      </button>

      {open && menuPos && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={t.common.language}
          className="fixed z-[100] max-h-[min(50dvh,16rem)] w-[10.5rem] overflow-y-auto overscroll-contain rounded-lg border border-border bg-card py-1 shadow-xl shadow-black/50"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.common.language}
          </p>
          {locales.map((l) => (
            <button
              key={l.id}
              type="button"
              role="option"
              aria-selected={locale === l.id}
              onClick={() => pick(l.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted active:bg-muted",
                locale === l.id ? "text-primary" : "text-foreground",
              )}
            >
              <span>
                <span className="font-medium">{l.short}</span>
                <span className="ml-2 text-muted-foreground">{l.label}</span>
              </span>
              {locale === l.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
