"use client"

import Link from "next/link"
import { ArrowRight, Layers } from "lucide-react"
import { MARKET_LAYERS, type MarketLayer } from "@/lib/layers"
import { cn } from "@/lib/utils"

const colorBorder: Record<MarketLayer["color"], string> = {
  primary: "border-primary/40 hover:border-primary/70 bg-primary/5",
  blue: "border-blue-500/40 hover:border-blue-500/70 bg-blue-500/5",
  green: "border-green-500/40 hover:border-green-500/70 bg-green-500/5",
  yellow: "border-yellow-500/40 hover:border-yellow-500/70 bg-yellow-500/5",
  red: "border-red-500/40 hover:border-red-500/70 bg-red-500/5",
  violet: "border-violet-500/40 hover:border-violet-500/70 bg-violet-500/5",
}

const colorText: Record<MarketLayer["color"], string> = {
  primary: "text-primary",
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
  violet: "text-violet-400",
}

export function LayersStack({ compact = false }: { compact?: boolean }) {
  return (
    <section className={cn("container mx-auto max-w-[1400px] px-4", compact ? "py-8" : "py-14")}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl animate-fade-up">
          <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            <Layers className="h-3.5 w-3.5" /> Multi-layer architecture
          </p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Not one flat market: seven independent layers
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Protocol → Identity → Discovery → Matching → Execution → Settlement → Governance.
            Swap layers without redesigning the whole stack. Each layer has its own contracts, routes, and failure modes.
          </p>
        </div>
        <Link
          href="/layers"
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/40 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          Open layer map <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Vertical stack. Bottom protocol to top governance */}
      <div className="relative mx-auto max-w-3xl space-y-2">
        <div className="pointer-events-none absolute bottom-4 left-1/2 top-4 hidden w-px -translate-x-1/2 bg-gradient-to-b from-red-500/40 via-primary/30 to-blue-500/40 md:block" />
        {[...MARKET_LAYERS].reverse().map((layer, i) => (
          <Link
            key={layer.id}
            href={`/layers/${layer.id}`}
            className={cn(
              "group relative flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 animate-fade-up",
              colorBorder[layer.color],
            )}
            style={{
              animationDelay: "0ms",
              marginLeft: `${(MARKET_LAYERS.length - 1 - i) * 4}px`,
              marginRight: `${i * 4}px`,
            }}
          >
            <div className={cn("flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-border/60 bg-background font-mono text-[10px] font-bold", colorText[layer.color])}>
              <span>{layer.short}</span>
              <span className="text-[9px] font-normal text-muted-foreground">L{layer.level}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold md:text-base">{layer.name}</h3>
                <span className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {layer.status}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground md:text-sm">{layer.tagline}</p>
            </div>
            <ArrowRight className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100", colorText[layer.color])} />
          </Link>
        ))}
      </div>

      {!compact && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Click any layer to open contracts, flows, and deep links. You are never locked into a single surface.
        </p>
      )}
    </section>
  )
}
