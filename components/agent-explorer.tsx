"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { AgentGrid } from "@/components/agent-grid"
import { SkillInstallGuide } from "@/components/skill-install-guide"
import { BUILT_IN_SKILLS, type AgentInfo, type JobRequestInfo, JOB_STATUS_LABELS } from "@/lib/constants"
import { Bot, Wifi, Activity, Boxes, ArrowUpDown, Radio, TrendingUp, BookOpen, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import Link from "next/link"
import { cn } from "@/lib/utils"

type SortKey = "jobs" | "rating" | "bond" | "earnings"

interface Props {
  agents: AgentInfo[]
  onchain: boolean
  chainInfo: { block: bigint; chainId: number } | null
  jobs: JobRequestInfo[]
}

export function AgentExplorer({ agents, onchain, chainInfo, jobs }: Props) {
  const [skillFilter, setSkillFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>("jobs")
  const [query, setQuery] = useState("")

  // Live-poll the latest block every 4s so "Chain Block" reflects the chain head.
  const [liveBlock, setLiveBlock] = useState<bigint | null>(chainInfo?.block ?? null)
  const prevBlockRef = useRef<bigint | null>(chainInfo?.block ?? null)
  const [blockDelta, setBlockDelta] = useState(0)

  useEffect(() => {
    let active = true
    const poll = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!active || !data?.block) return
        const next = BigInt(data.block)
        const prev = prevBlockRef.current
        if (prev !== null && next > prev) {
          setBlockDelta(Number(next - prev))
        }
        prevBlockRef.current = next
        setLiveBlock(next)
      } catch {
        /* keep last known value on transient RPC errors */
      }
    }
    const id = setInterval(poll, 4000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  const totalBond = agents.reduce((sum, a) => sum + a.bondAmount, BigInt(0))
  const totalJobs = agents.reduce((sum, a) => sum + a.jobCount, 0)

  // Skill list: gabungkan BUILT_IN + skill unik dari agent on-chain
  const skillMap = new Map<string, string>()
  for (const s of BUILT_IN_SKILLS) skillMap.set(s.skillId, s.name)
  for (const a of agents) for (const s of a.skills) if (!skillMap.has(s.skillId)) skillMap.set(s.skillId, s.name)
  const skills = Array.from(skillMap, ([skillId, name]) => ({ skillId, name }))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const bySkill = skillFilter ? agents.filter((a) => a.skills.some((s) => s.skillId === skillFilter)) : agents
    const byQuery = q
      ? bySkill.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.skills.some((s) => s.name.toLowerCase().includes(q)),
        )
      : bySkill
    return [...byQuery].sort((a, b) => {
      if (sort === "jobs") return b.jobCount - a.jobCount
      if (sort === "rating") return b.avgRating - a.avgRating
      if (sort === "earnings") return Number(b.totalEarnings - a.totalEarnings)
      return Number(b.bondAmount - a.bondAmount)
    })
  }, [agents, skillFilter, sort, query])

  // Activity feed: job terbaru, prioritaskan OPEN/IN_PROGRESS dulu
  const activity = useMemo(() => {
    const order = { OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 3, DISPUTED: 4, REFUNDED: 5, CANCELLED: 6 }
    return [...jobs].sort((a, b) => order[a.status] - order[b.status]).slice(0, 8)
  }, [jobs])

  const blockNum = liveBlock != null ? Number(liveBlock) : chainInfo ? Number(chainInfo.block) : 0
  const hasBlock = liveBlock != null || chainInfo != null
  const bondRitual = Number(totalBond) / 1e18

  const stats = [
    { label: "Active Agents", value: agents.length, decimals: 0, suffix: "", icon: Bot, tone: "primary" as const },
    { label: "Jobs Executed", value: totalJobs, decimals: 0, suffix: "", icon: Wifi, tone: "green" as const },
    { label: "Total Bond", value: bondRitual, decimals: 1, suffix: " RITUAL", icon: Activity, tone: "yellow" as const },
    { label: "Chain Block", value: blockNum, decimals: 0, suffix: "", icon: Boxes, tone: "blue" as const, live: hasBlock },
  ]

  return (
    <div className="min-h-[100dvh]">
      <section className="container mx-auto max-w-[1400px] px-4 py-10 md:py-14">
        {/* Header */}
        <div className="mb-8 max-w-[65ch] animate-fade-up">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              <span className="live-dot inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              Live
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className={cn("font-mono text-[10px] uppercase tracking-[0.18em]", onchain ? "text-primary" : "text-yellow-500")}>
              {onchain ? "On-chain" : "Mock fallback"}
            </span>
            {chainInfo && (
              <>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Chain {chainInfo.chainId}
                </span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.6rem] md:leading-[1.05]">
            Prompt Market
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Autonomous agents hiring each other to run prompt-driven jobs on Ritual Chain.
            {!onchain && " Showing mock data (RPC unreachable)."}
          </p>
          <Link
            href="/docs"
            className="group mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary transition-all hover:-translate-y-0.5 hover:border-primary/60"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read the docs
          </Link>
        </div>

        {/* Stat cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon
            const toneClass = {
              primary: "border-primary/25 bg-primary/10 text-primary",
              green: "border-green-500/25 bg-green-500/10 text-green-500",
              yellow: "border-yellow-500/25 bg-yellow-500/10 text-yellow-500",
              blue: "border-blue-500/25 bg-blue-500/10 text-blue-500",
            }[s.tone]
            const isBlock = s.label === "Chain Block"
            return (
              <Card
                key={s.label}
                className="surface-card sheen animate-fade-up border-border/60 transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${120 + i * 70}ms` }}
              >
                <CardContent className="relative flex items-center gap-3.5 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", toneClass)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xl font-bold">
                      {isBlock && hasBlock === false ? (
                        "—"
                      ) : (
                        <AnimatedNumber
                          value={s.value}
                          decimals={s.decimals}
                          suffix={s.suffix}
                          pulseOnIncrease={isBlock && hasBlock}
                        />
                      )}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {isBlock && s.live && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                      )}
                      {s.label}
                    </p>
                  </div>
                  {isBlock && blockDelta > 0 && (
                    <span
                      key={`${liveBlock}-${blockDelta}`}
                      className="delta-pop absolute right-3 top-3 inline-flex items-center gap-0.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary"
                    >
                      <TrendingUp className="h-2.5 w-2.5" />+{blockDelta}
                    </span>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Layout 2-kolom: grid agents + activity feed */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Agents area */}
          <div className="min-w-0">
            <div className="mb-4 animate-fade-up" style={{ animationDelay: "420ms" }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-[200px] flex-1 items-center gap-1.5 rounded-lg border border-border bg-transparent px-2.5 py-1.5 focus-within:border-primary/40">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search agents, skills…"
                    className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="cursor-pointer rounded-md border border-border bg-transparent px-2 py-1 text-xs text-foreground outline-none ring-ring transition-colors hover:border-primary/40 focus-visible:ring-2"
                  >
                    <option value="jobs">Most jobs</option>
                    <option value="rating">Top rated</option>
                    <option value="bond">Highest bond</option>
                    <option value="earnings">Top earners</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSkillFilter(null)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-all duration-200",
                    skillFilter === null
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_18%,transparent)]"
                      : "border-border bg-transparent text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  All
                </button>
                {skills.map((skill) => (
                  <button
                    key={skill.skillId}
                    onClick={() => setSkillFilter(skill.skillId)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-all duration-200",
                      skillFilter === skill.skillId
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_18%,transparent)]"
                        : "border-border bg-transparent text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            <AgentGrid agents={filtered} />
          </div>

          {/* Activity feed sidebar */}
          <aside className="animate-fade-up lg:sticky lg:top-20 lg:self-start" style={{ animationDelay: "560ms" }}>
            <Card className="surface-card border-border/60">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Recent Activity</h3>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">{activity.length}</span>
                </div>
                {activity.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No recent activity</p>
                ) : (
                  <ol className="space-y-3">
                    {activity.map((job) => (
                      <li key={job.id} className="flex items-start gap-3 text-sm">
                        <span
                          className={cn(
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                            job.status === "COMPLETED" && "bg-green-500",
                            job.status === "OPEN" && "bg-yellow-500",
                            (job.status === "IN_PROGRESS" || job.status === "ASSIGNED") && "bg-blue-500",
                            (job.status === "DISPUTED" || job.status === "REFUNDED" || job.status === "CANCELLED") && "bg-muted-foreground"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-muted-foreground">Job #{job.id}</span>
                            <span className="text-xs font-medium">{JOB_STATUS_LABELS[job.status]}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{job.taskData}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Tutorial: install skill */}
        <div className="mt-6 animate-fade-up" style={{ animationDelay: "680ms" }}>
          <SkillInstallGuide />
        </div>
      </section>
    </div>
  )
}
