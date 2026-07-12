import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Box, GitBranch, Route } from "lucide-react"
import { MARKET_LAYERS, getLayer, adjacentLayers, type LayerId } from "@/lib/layers"
import { LayerRail } from "@/components/layer-rail"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function generateStaticParams() {
  return MARKET_LAYERS.map((l) => ({ slug: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const layer = getLayer(slug)
  if (!layer) return { title: "Layer" }
  return {
    title: `${layer.short} ${layer.name}`,
    description: layer.description,
  }
}

export default async function LayerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const layer = getLayer(slug)
  if (!layer) notFound()

  const { prev, next } = adjacentLayers(layer.id as LayerId)

  return (
    <div className="min-h-[100dvh]">
      <LayerRail activeId={layer.id} />

      <section className="container mx-auto max-w-[1100px] px-4 py-10 md:py-14">
        <Link href="/layers" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Layer map
        </Link>

        <div className="mb-8 animate-fade-up">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
              {layer.short}, Level {layer.level}
            </span>
            <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {layer.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{layer.name} layer</h1>
          <p className="mt-1 text-sm font-medium text-primary">{layer.tagline}</p>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{layer.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="surface-card border-border/60 md:col-span-2">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Box className="h-4 w-4 text-primary" /> Contracts & endpoints
              </h2>
              <ul className="space-y-2">
                {layer.contracts.map((c) => (
                  <li key={c.label + c.address} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                    <p className="text-xs font-medium">{c.label}</p>
                    <p className="break-all font-mono text-[11px] text-muted-foreground">{c.address}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="surface-card border-border/60">
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inputs</h3>
                <ul className="space-y-1 text-sm">
                  {layer.inputs.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outputs</h3>
                <ul className="space-y-1 text-sm">
                  {layer.outputs.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-500" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <GitBranch className="h-4 w-4 text-primary" /> Flows
              </h2>
              <div className="flex flex-wrap gap-2">
                {layer.flows.map((f) => (
                  <span key={f} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-mono text-[11px]">
                    {f}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Route className="h-4 w-4 text-primary" /> Deep links
              </h2>
              <div className="flex flex-wrap gap-2">
                {layer.routes.map((r) => (
                  <Button key={r.href} asChild variant="outline" size="sm" className="rounded-full">
                    <Link href={r.href}>{r.label}</Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Adjacent layers. never stuck on one */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
          {prev ? (
            <Link
              href={`/layers/${prev.id}`}
              className="group flex items-center gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm transition-colors hover:border-primary/40"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              <div>
                <p className="font-mono text-[10px] text-muted-foreground">Previous: {prev.short}</p>
                <p className="font-medium">{prev.name}</p>
              </div>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/layers/${next.id}`}
              className="group flex items-center justify-end gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm transition-colors hover:border-primary/40 sm:text-right"
            >
              <div>
                <p className="font-mono text-[10px] text-muted-foreground">Next: {next.short}</p>
                <p className="font-medium">{next.name}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  )
}
