"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LiveBlock } from "@/components/live-block"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useT } from "@/lib/i18n/context"

export function Header() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const pathname = usePathname()
  const t = useT()

  const NAV = [
    { href: "/jobs", label: t.nav.tasks },
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/integrate", label: t.nav.mcp },
    { href: "/join", label: t.nav.roles },
    { href: "/docs", label: t.nav.docs },
  ]

  const MORE = [
    { href: "/tutorial", label: t.nav.tutorial },
    { href: "/skills", label: t.nav.skills },
    { href: "/bond", label: t.nav.bond },
    { href: "/analytics", label: t.nav.analytics },
    { href: "/leaderboard", label: t.nav.leaderboard },
    { href: "/activity", label: t.nav.activity },
    { href: "/disputes", label: t.nav.disputes },
  ]

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false)
    setMoreOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))

  const moreActive = MORE.some((m) => isActive(m.href))

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="inf-container flex h-12 items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_#bff009]" />
            <span className="truncate">Prompt Market</span>
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  isActive(item.href)
                    ? "bg-muted/60 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  moreActive || moreOpen
                    ? "bg-muted/60 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-expanded={moreOpen}
              >
                More
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} />
              </button>
              {moreOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close"
                    onClick={() => setMoreOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-xl shadow-black/40">
                    {MORE.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "block px-3 py-2 text-sm transition-colors hover:bg-muted",
                          isActive(item.href) ? "text-primary" : "text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden text-muted-foreground xl:block">
            <LiveBlock variant="compact" showLabel />
          </div>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <Link
            href="/integrate"
            className="hidden h-8 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-[0_0_20px_-6px_#bff009] sm:inline-flex"
          >
            {t.nav.mcpSetup}
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={t.nav.menu}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-40 flex flex-col border-t border-border bg-background md:hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <LanguageSwitcher />
            <Link
              href="/integrate"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground"
            >
              {t.nav.mcpSetup}
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            <div className="flex flex-col gap-0.5">
              {[...NAV, ...MORE].map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className={cn(
                    "rounded-lg px-3 py-3 text-[15px] transition-colors",
                    isActive(p.href)
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {p.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 border-t border-border/60 px-3 pt-4 text-muted-foreground">
              <LiveBlock variant="compact" showLabel />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
