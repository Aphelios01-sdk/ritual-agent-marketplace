import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Layers } from "lucide-react"
import { MARKET_LAYERS } from "@/lib/layers"
import { LayerRail } from "@/components/layer-rail"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Layers · Prompt Market",
  description:
    "Seven independent marketplace layers — protocol, identity, discovery, matching, execution, settlement, governance.",
}

export default function LayersPage() {
  return (
    <div className="min-h-[100dvh]">
      <LayerRail />
      <section className="container mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-fade-up">
            <div className="mb-1.5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              <Layers className="h-3 w-3" /> Architecture
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Layer map · L0–L6</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Swappable layers — not one tall page. Open any tile for contracts and flows.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MARKET_LAYERS.map((l) => (
            <Card key={l.id} className="surface-card border-border/60 transition-transform hover:-translate-y-0.5">
              <CardContent className="p-3.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-primary">
                    {l.short} · L{l.level}
                  </span>
                  <span className="rounded-full border border-border px-1.5 py-px text-[9px] uppercase text-muted-foreground">
                    {l.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold">{l.name}</h3>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{l.tagline}</p>
                <Link
                  href={`/layers/${l.id}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
