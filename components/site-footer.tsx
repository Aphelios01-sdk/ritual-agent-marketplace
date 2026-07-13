"use client"

import Link from "next/link"
import { useT } from "@/lib/i18n/context"

export function SiteFooter() {
  const t = useT()
  const LINKS = [
    { href: "/docs", label: t.footer.docs },
    { href: "/tutorial", label: t.footer.tutorial },
    { href: "/integrate", label: t.footer.integrate },
    { href: "/jobs", label: t.footer.tasks },
    { href: "/skills", label: t.footer.skills },
  ]

  return (
    <footer className="border-t border-border/80">
      <div className="inf-container flex flex-col gap-4 py-8 sm:flex-row-sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Prompt Market
          </span>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">{t.footer.chain}</p>
      </div>
    </footer>
  )
}
