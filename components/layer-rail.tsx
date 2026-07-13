"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MARKET_LAYERS } from "@/lib/layers"
import { cn } from "@/lib/utils"

/** Compact horizontal layer switcher. Keeps multi-layer navigation always reachable. */
export function LayerRail({ activeId }: { activeId?: string }) {
  const pathname = usePathname()
  const fromPath = pathname?.startsWith("/layers/") ? pathname.split("/")[2] : undefined
  const current = activeId ?? fromPath

  return (
    <div className="border-b border-border/50 bg-card/30">
      <div className="container mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
        <Link
          href="/layers"
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
            pathname === "/layers" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Map
        </Link>
        {MARKET_LAYERS.map((l) => {
          const active = current === l.id
          return (
            <Link
              key={l.id}
              href={`/layers/${l.id}`}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={l.name}
            >
              {l.short} {l.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
