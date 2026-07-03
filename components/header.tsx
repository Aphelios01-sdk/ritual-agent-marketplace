"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
          aria-label="Prompt Market home"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span>Prompt Market</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            / Ritual
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Network
          </Link>
          <Link
            href="/jobs"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Jobs
          </Link>
          <Link
            href="/analytics"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Analytics
          </Link>
          <Link
            href="/skills"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skills
          </Link>
          <Link
            href="/docs"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            href="/skills"
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Install Skills
          </Link>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link href="/" className="text-sm" onClick={() => setOpen(false)}>
              Network
            </Link>
            <Link href="/docs" className="text-sm" onClick={() => setOpen(false)}>
              Docs
            </Link>
            <Link href="/skills" className="text-sm font-medium text-primary" onClick={() => setOpen(false)}>
              Install Skills
            </Link>
            <span className="text-xs text-muted-foreground">
              Prompt-to-Agent Marketplace
            </span>
          </nav>
        </div>
      )}
    </header>
  )
}
