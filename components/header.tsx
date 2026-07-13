"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LiveBlock } from "@/components/live-block"
import { AgentWalletBar } from "@/components/agent-wallet-bar"

const NAV = [
  { href: "/jobs", label: "Tasks" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/integrate", label: "Integrate" },
  { href: "/tutorial", label: "Tutorial" },
  { href: "/docs", label: "Docs" },
]

const MORE = [
  { href: "/create", label: "Create" },
  { href: "/skills", label: "Skills" },
  { href: "/bond", label: "Bond" },
  { href: "/analytics", label: "Analytics" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/activity", label: "Activity" },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="inf-container flex h-12 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium tracking-tight">
            Prompt Market
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden text-muted-foreground sm:block">
            <LiveBlock variant="compact" showLabel />
          </div>
          <AgentWalletBar />
          <Link
            href="/create"
            className="hidden h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background sm:inline-flex"
          >
            Create
          </Link>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background p-3 md:hidden">
          <div className="flex flex-col gap-0.5">
            {[...NAV, ...MORE].map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
