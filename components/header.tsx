"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { LiveBlock } from "@/components/live-block"

const PRODUCTS = [
  { href: "/create", title: "Deploy", desc: "Launch agents with skills and bond." },
  { href: "/analytics", title: "Observe", desc: "Monitor agents, jobs, and chain health." },
  { href: "/dashboard", title: "Trace", desc: "Job lifecycle and on-chain events." },
  { href: "/skills", title: "Skills", desc: "HTTP & LLM precompile catalog." },
  { href: "/disputes", title: "Evaluate", desc: "Dispute council and evaluators." },
  { href: "/layers", title: "Layers", desc: "L0–L6 multi-layer map." },
]

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Tasks" },
  { href: "/#agents", label: "Agents" },
  { href: "/docs", label: "Docs" },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [prodOpen, setProdOpen] = useState(false)
  const pathname = usePathname()
  const isDash = pathname.startsWith("/dashboard")

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl">
      {!isDash && (
        <div className="border-b border-border/30 bg-card/30">
          <div className="inf-container flex min-h-9 items-center justify-center gap-2 py-1.5 text-center text-xs">
            <span className="rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              New
            </span>
            <span className="text-muted-foreground">
              Full stack live on Ritual · multi-layer marketplace
            </span>
            <Link href="/layers" className="inline-flex items-center font-medium text-[#00ff99] hover:opacity-90">
              Explore <ArrowRight className="ml-0.5 h-3 w-3 opacity-70" />
            </Link>
          </div>
        </div>
      )}

      <div className="inf-container flex h-13 items-center justify-between gap-4" style={{ height: "3.25rem" }}>
        <div className="flex items-center gap-7">
          <Link href="/" className="group flex items-center gap-2.5 tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#00ff99] text-[11px] font-bold text-[#020617] shadow-[0_0_16px_-4px_rgba(0,255,153,0.7)]">
              P
            </span>
            <span className="text-sm font-semibold">Prompt Market</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setProdOpen(true)}
              onMouseLeave={() => setProdOpen(false)}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Product <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              {prodOpen && (
                <div className="absolute left-0 top-full z-50 w-[400px] pt-2">
                  <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-0.5">
                      {PRODUCTS.map((p) => (
                        <Link
                          key={p.href}
                          href={p.href}
                          className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
                        >
                          <span className="text-[13px] font-semibold tracking-tight">{p.title}</span>
                          <span className="text-[11px] leading-relaxed text-muted-foreground">{p.desc}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-border/40 px-3 py-2">
                      <Link href="/join" className="text-[11px] text-muted-foreground hover:text-foreground">
                        Talk to us
                      </Link>
                      <Link href="/dashboard" className="inf-btn inf-btn-primary h-7 px-2.5 text-[11px]">
                        Dashboard
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname.startsWith("/dashboard")
                  : item.href !== "/#agents" && pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[13px] transition-colors hover:text-foreground",
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
          <div className="hidden items-center rounded-full border border-border/50 bg-card/40 px-2.5 py-1 lg:flex">
            <LiveBlock variant="compact" showLabel />
          </div>
          <Link
            href="/docs"
            className="hidden text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Docs
          </Link>
          <Link
            href="/join"
            className="hidden text-[13px] text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Talk to an Engineer
          </Link>
          <Link href="/dashboard" className="inf-btn inf-btn-primary h-8 px-3 text-xs">
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
        <div className="border-t border-border/40 bg-background/95 p-3 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-0.5">
            {PRODUCTS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-xl px-3 py-2.5 hover:bg-muted/50"
                onClick={() => setOpen(false)}
              >
                <span className="text-sm font-semibold">{p.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{p.desc}</span>
              </Link>
            ))}
            <Link href="/dashboard" className="rounded-xl px-3 py-2.5 text-sm font-medium" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
