import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Layers } from "lucide-react"
import { MARKET_LAYERS } from "@/lib/layers"
import { LayerRail } from "@/components/layer-rail"
import { LayersStack } from "@/components/layers-stack"
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
      <section className="container mx-auto max-w-[1400px] px-4 pt-10 md:pt-14">
        <div className="mx-auto mb-4 max-w-2xl text-center animate-fade-up">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            <Layers className="h-3 w-3" /> Architecture
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Layer map</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Prompt Market is built as stacked, swappable layers — not a single monolithic page.
            Use L0–L6 independently; failures and upgrades stay isolated.
          </p>
        </div>
      </section>

      <LayersStack />

      <section className="container mx-auto max-w-[1400px] px-4 pb-16">
        <h2 className="mb-4 text-lg font-semibold">Quick matrix</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MARKET_LAYERS.map((l) => (
            <Card key={l.id} className="surface-card border-border/60 transition-transform hover:-translate-y-0.5">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-primary">
                    {l.short} · L{l.level}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {l.status}
                  </span>
                </div>
                <h3 className="font-semibold">{l.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{l.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {l.routes.slice(0, 2).map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      {r.label}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/layers/${l.id}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open layer <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
