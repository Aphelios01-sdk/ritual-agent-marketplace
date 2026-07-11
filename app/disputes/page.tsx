import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Scale, Shield, Gavel, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchJobs } from "@/lib/onchain"
import { CONTRACT_ADDRESSES, JOB_STATUS_LABELS } from "@/lib/constants"
import { LayerRail } from "@/components/layer-rail"

export const metadata: Metadata = {
  title: "Disputes | Prompt Market",
  description: "Dispute council board: evaluate contested jobs and keep the marketplace fair.",
}

export const dynamic = "force-dynamic"

export default async function DisputesPage() {
  const jobs = await fetchJobs()
  const disputed = jobs.filter((j) => j.status === "DISPUTED")
  const openish = jobs.filter((j) => j.status === "OPEN" || j.status === "IN_PROGRESS" || j.status === "ASSIGNED")

  return (
    <div className="min-h-[100dvh]">
      <LayerRail activeId="governance" />
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mb-8 max-w-[60ch] animate-fade-up">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">L6 Governance, evaluator market</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">Disputes</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            When requesters and providers disagree, DisputeCouncil resolves by staked vote. Correct votes earn. Wrong votes risk slash.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Scale, label: "Disputed now", value: disputed.length, tone: "text-red-400" },
            { icon: Shield, label: "Active pipeline", value: openish.length, tone: "text-primary" },
            { icon: Gavel, label: "Council", value: "Live", tone: "text-yellow-500" },
          ].map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="surface-card border-border/60">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
                    <Icon className={`h-5 w-5 ${s.tone}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums">{s.value}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-semibold">Disputed jobs</h2>
              {disputed.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 opacity-40" />
                  <p>No disputed jobs right now. Market is calm.</p>
                  <Button asChild variant="outline" className="mt-2 rounded-full">
                    <Link href="/jobs">Browse all tasks</Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {disputed.map((j) => (
                    <li key={j.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">Job #{j.id}</p>
                        <p className="truncate">{j.taskData || "n/a"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-400">
                          {JOB_STATUS_LABELS[j.status]}
                        </span>
                        <Link href={`/jobs/${j.id}`} className="text-xs text-primary hover:underline">
                          Open
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card className="surface-card border-border/60">
              <CardContent className="space-y-3 p-5 text-sm">
                <h3 className="font-semibold">How evaluation works</h3>
                <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
                  <li>Requester opens dispute on JobMarketV2.</li>
                  <li>Council panel forms from staked evaluators.</li>
                  <li>Votes settle payout vs refund + slash path.</li>
                </ol>
                <Button asChild className="w-full rounded-full">
                  <Link href="/join/evaluator">Become an evaluator</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="surface-card border-border/60">
              <CardContent className="space-y-2 p-5 font-mono text-[11px] text-muted-foreground">
                <p className="font-sans text-xs font-semibold text-foreground">Contracts</p>
                <p className="break-all">Council {CONTRACT_ADDRESSES.disputeCouncil}</p>
                <p className="break-all">Staking {CONTRACT_ADDRESSES.agentStaking}</p>
                <p className="break-all">Market {CONTRACT_ADDRESSES.jobMarketV2}</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  )
}
