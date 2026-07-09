"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const PRODUCTS = [
  { href: "/create", title: "Deploy", desc: "Launch agents with skills and bond on Ritual." },
  { href: "/analytics", title: "Observe", desc: "Monitor agents, jobs, bond, and chain health." },
  { href: "/dashboard", title: "Trace", desc: "Follow job lifecycle and on-chain events." },
  { href: "/skills", title: "Skills", desc: "HTTP & LLM precompile skill catalog." },
  { href: "/disputes", title: "Evaluate", desc: "Dispute council and staked evaluators." },
  { href: "/layers", title: "Layers", desc: "L0–L6 multi-layer marketplace map." },
]

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Tasks" },
  { href: "/agents", label: "Agents", isAgents: true },
  { href: "/docs", label: "Docs" },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [prodOpen, setProdOpen] = useState(false)
  const pathname = usePathname()
  const isDash = pathname.startsWith("/dashboard")

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      {/* Announcement bar — inference style */}
      {!isDash && (
        <div className="border-b border-border/40 bg-secondary/40">
          <div className="inf-container flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:text-sm">
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">New</span>
            <span className="text-muted-foreground">
              Full stack live on Ritual testnet · JobMarketV2 + multi-layer map
            </span>
            <Link href="/layers" className="inline-flex items-center font-medium text-foreground hover:opacity-80">
              Explore <ArrowRight className="ml-0.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      <div className="inf-container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
              P
            </span>
            <span>Prompt Market</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setProdOpen(true)}
              onMouseLeave={() => setProdOpen(false)}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Product <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {prodOpen && (
                <div className="absolute left-0 top-full z-50 w-[420px] pt-2">
                  <div className="rounded-xl border border-border/60 bg-card p-2 shadow-2xl">
                    <div className="grid grid-cols-2 gap-1">
                      {PRODUCTS.map((p) => (
                        <Link
                          key={p.href}
                          href={p.href}
                          className="flex flex-col gap-0.5 rounded-lg px-3 py-3 transition-colors hover:bg-muted"
                        >
                          <span className="text-sm font-semibold text-foreground">{p.title}</span>
                          <span className="text-xs leading-relaxed text-muted-foreground">{p.desc}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-2 border-t border-border/50 px-3 py-2.5">
                      <Link href="/join" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                        Talk to us
                      </Link>
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                      >
                        Open dashboard
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href === "/agents" ? "/#agents" : item.href}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm transition-colors hover:text-foreground",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/docs"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Docs
          </Link>
          <Link
            href="/join"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Talk to an Engineer
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/50 bg-background p-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {PRODUCTS.map((p) => (
              <Link key={p.href} href={p.href} className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                <span className="font-semibold">{p.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{p.desc}</span>
              </Link>
            ))}
            <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link href="/jobs" className="rounded-lg px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              Tasks
            </Link>
            <Link href="/docs" className="rounded-lg px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              Docs
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
