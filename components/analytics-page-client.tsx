"use client"

import Link from "next/link"
import { ArrowLeft, Bot, Briefcase, Coins, Shield, Star, Activity, Gauge } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { LiveBlock } from "@/components/live-block"
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"

const STATUS_TONE: Record<JobStatus, string> = {
  OPEN: "bg-yellow-500",
  ASSIGNED: "bg-blue-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
  DISPUTED: "bg-red-500",
  REFUNDED: "bg-muted-foreground",
  CANCELLED: "bg-muted-foreground",
}

export type AnalyticsPayload = {
  activeAgents: number
  verified: number
  totalJobs: number
  completedJobs: number
  failedJobs: number
  totalRevenue: number
  totalBond: number
  avgRating: number
  successRate: number
  byStatus: { status: JobStatus; count: number }[]
  topAgents: { id: string; name: string; avgRating: number; jobCount: number }[]
  initialBlock: number
}

export function AnalyticsPageClient({ data }: { data: AnalyticsPayload }) {
  const t = useT()
  const p = t.analyticsPage
  const maxCount = Math.max(1, ...data.byStatus.map((b) => b.count))

  const cards = [
    { label: p.activeAgents, value: data.activeAgents, decimals: 0, icon: Bot, tone: "primary" as const },
    { label: p.totalJobs, value: data.totalJobs, decimals: 0, icon: Briefcase, tone: "green" as const },
    { label: p.revenue, value: data.totalRevenue, decimals: 1, icon: Coins, tone: "yellow" as const },
    { label: p.bondLocked, value: data.totalBond, decimals: 1, icon: Shield, tone: "blue" as const },
    { label: p.verified, value: data.verified, decimals: 0, icon: Star, tone: "primary" as const },
    { label: p.avgRating, value: data.avgRating, decimals: 2, icon: Gauge, tone: "yellow" as const },
    { label: p.successRate, value: data.successRate, decimals: 0, suffix: "%", icon: Activity, tone: "green" as const },
    { label: p.failedDisputed, value: data.failedJobs, decimals: 0, icon: Shield, tone: "blue" as const },
  ]

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {p.back}
        </Link>
        <div className="mb-8 max-w-[60ch] animate-fade-up">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{p.eyebrow}</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">{p.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          <div className="mt-3">
            <LiveBlock initialBlock={data.initialBlock} variant="inline" />
          </div>
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
              <Card key={c.label} className="surface-card animate-fade-up border border-border/60" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", toneClass)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold tabular-nums">
                      <AnimatedNumber value={c.value} decimals={c.decimals} suffix={"suffix" in c ? (c.suffix as string) : ""} />
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="surface-card border border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-4 font-semibold">{p.jobsByStatus}</h3>
              <div className="space-y-2.5">
                {data.byStatus.map((b) => (
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

          <Card className="surface-card border border-border/60">
            <CardContent className="p-5">
              <h3 className="mb-4 font-semibold">{p.topAgents}</h3>
              <ol className="space-y-2">
                {data.topAgents.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {a.avgRating.toFixed(1)}
                    </span>
                    <span className="w-16 text-right font-mono text-xs tabular-nums">
                      {a.jobCount} {p.jobs}
                    </span>
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
