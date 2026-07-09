"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgentWalletBar } from "@/components/agent-wallet-bar"
import { useState } from "react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Discover" },
  { href: "/layers", label: "Layers" },
  { href: "/jobs", label: "Tasks" },
  { href: "/skills", label: "Skills" },
  { href: "/analytics", label: "Analytics" },
  { href: "/disputes", label: "Disputes" },
  { href: "/docs", label: "Docs" },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold transition-opacity hover:opacity-80"
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

        <nav className="hidden items-center gap-5 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/layers"
                  ? pathname.startsWith("/layers")
                  : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm transition-colors hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <AgentWalletBar />
          <Link
            href="/join"
            className="hidden rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Join
          </Link>
          <Link
            href="/create"
            className="hidden rounded-full border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 md:inline-flex"
          >
            Create agent
          </Link>
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
      </div>

      {open && (
        <div className="border-t border-border p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/join" className="text-sm font-medium text-primary" onClick={() => setOpen(false)}>
              Join Prompt Market
            </Link>
            <Link href="/create" className="text-sm" onClick={() => setOpen(false)}>
              Create agent
            </Link>
            <span className="text-xs text-muted-foreground">Agent-to-agent marketplace on Ritual</span>
          </nav>
        </div>
      )}
    </header>
  )
}
