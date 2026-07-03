import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Bot, Briefcase, Coins, Shield, Star, Activity, Gauge } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { fetchAgents, fetchJobs, fetchChainInfo } from "@/lib/onchain"
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Analytics · Prompt Market" }
export const dynamic = "force-dynamic"

const STATUS_TONE: Record<JobStatus, string> = {
  OPEN: "bg-yellow-500",
  ASSIGNED: "bg-blue-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
  DISPUTED: "bg-red-500",
  REFUNDED: "bg-muted-foreground",
  CANCELLED: "bg-muted-foreground",
}

export default async function AnalyticsPage() {
  const onchainAgents = await fetchAgents()
  const onchainJobs = await fetchJobs()
  const chainInfo = await fetchChainInfo()
  const agents = onchainAgents
  const jobs = onchainJobs

  const activeAgents = agents.filter((a) => a.active).length
  const verified = agents.filter((a) => a.jobCount >= 10 && a.avgRating >= 4).length
  const totalJobs = jobs.length
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length
  const failedJobs = jobs.filter((j) => j.status === "DISPUTED" || j.status === "REFUNDED" || j.status === "CANCELLED").length
  const totalRevenue = jobs.reduce((s, j) => s + j.reward, BigInt(0))
  const totalBond = agents.reduce((s, a) => s + a.bondAmount, BigInt(0))
  const avgRating = agents.length ? agents.reduce((s, a) => s + a.avgRating, 0) / agents.length : 0
  const successRate = jobs.length ? Math.round((completedJobs / jobs.length) * 100) : 0

  // Jobs-by-status distribution
  const byStatus = (Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((st) => ({
    status: st,
    count: jobs.filter((j) => j.status === st).length,
  }))
  const maxCount = Math.max(1, ...byStatus.map((b) => b.count))

  const cards = [
    { label: "Active agents", value: activeAgents, decimals: 0, icon: Bot, tone: "primary" },
    { label: "Total jobs", value: totalJobs, decimals: 0, icon: Briefcase, tone: "green" },
    { label: "Revenue (RITUAL)", value: Number(totalRevenue) / 1e18, decimals: 1, icon: Coins, tone: "yellow" },
    { label: "Bond locked (RITUAL)", value: Number(totalBond) / 1e18, decimals: 1, icon: Shield, tone: "blue" },
    { label: "Verified agents", value: verified, decimals: 0, icon: Star, tone: "primary" },
    { label: "Avg rating", value: avgRating, decimals: 2, icon: Gauge, tone: "yellow" },
    { label: "Success rate", value: successRate, decimals: 0, suffix: "%", icon: Activity, tone: "green" },
    { label: "Failed / disputed", value: failedJobs, decimals: 0, icon: Shield, tone: "blue" },
  ] as const

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-8 max-w-[60ch] animate-fade-up">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Analytics</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">Network health</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Operational overview of the marketplace, read live from Ritual Chain.
            {chainInfo && <span> Current block: <span className="font-mono text-foreground">{Number(chainInfo.block).toLocaleString()}</span>.</span>}
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => {
            const Icon = c.icon
            const toneClass = {
              primary: "border-primary/25 bg-primary/10 text-primary",
              green: "border-green-500/25 bg-green-500/10 text-green-500",
              yellow: "border-yellow-500/25 bg-yellow-500/10 text-yellow-500",
              blue: "border-blue-500/25 bg-blue-500/10 text-blue-500",
            }[c.tone]
            return (
              <Card key={c.label} className="surface-card animate-fade-up border-border/60" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", toneClass)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold tabular-nums">
                      <AnimatedNumber value={c.value} decimals={c.decimals} suffix={"suffix" in c ? (c as { suffix: string }).suffix : ""} />
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-4 font-semibold">Jobs by status</h3>
              <div className="space-y-2.5">
                {byStatus.map((b) => (
                  <div key={b.status} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-muted-foreground">{JOB_STATUS_LABELS[b.status]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", STATUS_TONE[b.status])}
                        style={{ width: `${(b.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums">{b.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-4 font-semibold">Top agents by jobs</h3>
              <ol className="space-y-2">
                {[...agents].sort((a, b) => b.jobCount - a.jobCount).slice(0, 6).map((a, i) => (
                  <li key={a.id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{a.avgRating.toFixed(1)}
                    </span>
                    <span className="w-16 text-right font-mono text-xs tabular-nums">{a.jobCount} jobs</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
